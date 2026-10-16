import Magazine from '../models/Magazine';
import Article from '../models/Article';
import Catalog from '../models/Catalog';
import Cycle from '../models/Cycle';
import Film from '../models/Film';
import About from '../models/About';
import fs from 'fs';
import mongoose from 'mongoose';
import path from 'path';
import { executarSeed } from '../scripts/seed';
import { demoLigado } from './demoFlag';
import { pastaUploads } from './uploads';
import { avisarSite as avisarSitePadrao } from './avisarSite';

/**
 * Modo demonstração: só para o ambiente hospedado da demonstração (banco SÓ de exemplo).
 * Desligado por padrão; liga com DEMO_ENABLED=true. Com ele:
 *  - GET /api/demo descreve o papel de demonstração (sem senha nenhuma);
 *  - POST /api/demo/entrar emite um token de editor com um clique;
 *  - os dados voltam ao exemplo a cada DEMO_RESET_MINUTOS (padrão 60), contados a partir do
 *    último reset gravado no banco (sobrevive ao servidor dormir), e as imagens enviadas
 *    (pasta uploads/demo, até 2 MB, poucas por hora) são apagadas junto;
 *  - a API só parte se o banco tiver "demo" no nome (bancoAceitaDemonstracao).
 * Nunca ligue num banco com conteúdo real: o reset apaga tudo.
 */
export { demoLigado };

/** Minutos entre os resets (padrão 60, mínimo 15); 0 desliga o reset periódico */
export function intervaloResetMinutos(env: NodeJS.ProcessEnv = process.env): number {
  if (env.DEMO_RESET_MINUTOS === undefined || env.DEMO_RESET_MINUTOS === '') return 60;
  const minutos = Number(env.DEMO_RESET_MINUTOS);
  if (minutos === 0) return 0;
  return Math.max(15, minutos || 60);
}

/**
 * A demonstração apaga e recria o conteúdo, então só aceita um banco com "demo" no nome.
 * Única exceção: o banco local de desenvolvimento (iniciar.bat), fora de produção e com o
 * reset desligado (DEMO_RESET_MINUTOS=0), quando a demonstração só popula banco vazio.
 * Devolve o problema (para a API não partir) ou null.
 */
export function bancoAceitaDemonstracao(nomeBanco: string, env: NodeJS.ProcessEnv = process.env): string | null {
  if (/demo/i.test(nomeBanco)) return null;
  if (env.NODE_ENV !== 'production' && intervaloResetMinutos(env) === 0) return null;
  return (
    `DEMO_ENABLED=true com o banco "${nomeBanco}": o modo demonstração apaga e recria o conteúdo, ` +
    'então o nome do banco precisa conter "demo" (ex.: .../cineclube_demo em MONGODB_URI).'
  );
}

/** Pasta das imagens enviadas na demonstração (fica dentro da pasta de uploads) */
export const pastaUploadsDemonstracao = (pasta = pastaUploads()) => path.join(pasta, 'demo');

/**
 * Apaga as imagens enviadas na demonstração (e só elas). Usa fs.promises.rm: no Node 24
 * (Windows) o fs.rmSync volta sem erro e sem apagar quando o caminho tem acento, como o
 * "Projetos do portfólio" deste repositório.
 */
export async function limparUploadsDemonstracao(pasta = pastaUploads()) {
  await fs.promises.rm(pastaUploadsDemonstracao(pasta), { recursive: true, force: true });
}

const COLECOES = [Magazine, Article, Catalog, Cycle, Film, About];

/** O banco aceita transações? (replica set, como o Atlas M0; o mongod solto dos testes não) */
export async function emReplicaSet(): Promise<boolean> {
  try {
    const hello = await mongoose.connection.db!.admin().command({ hello: 1 });
    return Boolean(hello.setName);
  } catch {
    return false;
  }
}

type Seed = () => Promise<unknown>;
const seedPadrao: Seed = () => executarSeed({ banco: 'demonstração', force: true, confirmar: async () => true, log: () => {} });

/**
 * Repõe os dados de exemplo. soSeVazio: só popula se o banco estiver vazio (primeira partida).
 * Num replica set o seed roda numa transação: se falhar no meio, nada muda (o visitante nunca
 * vê o banco pela metade, e os slugs recriados não colidem com os antigos). Sem replica set
 * (desenvolvimento), roda direto. As imagens enviadas são apagadas mesmo se o seed falhar.
 */
export async function restaurarDemonstracao({
  soSeVazio,
  log = console.log,
  pasta = pastaUploads(),
  seed = seedPadrao,
}: {
  soSeVazio: boolean;
  log?: (m: string) => void;
  pasta?: string;
  seed?: Seed;
}) {
  if (soSeVazio) {
    const total = (await Promise.all(COLECOES.map((m) => (m as typeof Magazine).countDocuments()))).reduce((a, b) => a + b, 0);
    if (total > 0) return 'mantido' as const;
  }
  try {
    if (await emReplicaSet()) {
      // Com o AsyncLocalStorage, toda operação dentro da transação usa a sessão sozinha
      mongoose.set('transactionAsyncLocalStorage', true);
      await mongoose.connection.transaction(async () => {
        await seed();
      });
    } else {
      await seed();
    }
    log('Dados de exemplo da demonstração repostos.');
  } finally {
    if (!soSeVazio) await limparUploadsDemonstracao(pasta);
  }
  return 'restaurado' as const;
}

// ---------- quando restaurar ----------
// O reset não depende de a API ficar no ar: o horário do último reset fica no banco
// (coleção demo_meta) e é conferido na partida e a cada 5 minutos. O Render gratuito dorme
// depois de 15 min sem tráfego; ao acordar, a API confere e, se o prazo passou, restaura.

const meta = () => mongoose.connection.collection<{ _id: string; ultimoReset: Date }>('demo_meta');

export async function lerUltimoReset(): Promise<Date | null> {
  const doc = await meta().findOne({ _id: 'reset' });
  return doc?.ultimoReset ?? null;
}

async function gravarUltimoReset(quando: Date) {
  await meta().updateOne({ _id: 'reset' }, { $set: { ultimoReset: quando } }, { upsert: true });
}

export function resetVencido(ultimo: Date | null, agora: Date, minutos: number): boolean {
  if (!ultimo) return true;
  return agora.getTime() - ultimo.getTime() >= minutos * 60_000;
}

const UPLOAD_DEMO = /^\/uploads\/demo\//;

/**
 * Imagens da demonstração (URLs /uploads/demo/...) citadas nos campos de IMAGEM que não estão
 * mais no disco. Só os campos de imagem contam (texto corrido com o caminho não), e a busca é
 * por distinct com filtro no banco: nada de carregar documentos inteiros a cada 5 minutos.
 */
export async function uploadsFaltando(pasta = pastaUploads()): Promise<string[]> {
  const citados = new Set<string>();
  const juntar = (valores: unknown[]) => {
    for (const v of valores) if (typeof v === 'string' && UPLOAD_DEMO.test(v)) citados.add(v);
  };
  for (const modelo of [Magazine, Catalog, Cycle, Article]) {
    juntar(await (modelo as typeof Magazine).distinct('coverImage', { coverImage: UPLOAD_DEMO }));
  }
  juntar(await Film.distinct('image', { image: UPLOAD_DEMO }));
  juntar(await Article.distinct('images', { images: UPLOAD_DEMO }));
  for (const modelo of [Article, About]) {
    juntar(await (modelo as typeof Article).distinct('blocks.src', { blocks: { $elemMatch: { type: 'image', src: UPLOAD_DEMO } } }));
  }
  return [...citados].filter((url) => !fs.existsSync(path.join(pastaUploadsDemonstracao(pasta), path.basename(url))));
}

/**
 * Tira do conteúdo só as referências a uploads que sumiram: capa e imagem do filme ficam
 * vazias (o site mostra a capa padrão) e blocos de imagem quebrados saem. O resto do que os
 * visitantes fizeram fica. Ninguém provoca isso de propósito: o painel recusa salvar um
 * /uploads/demo/<nome> que não existe, e texto corrido não conta.
 */
export async function neutralizarUploadsFaltando(faltando: string[]) {
  if (faltando.length === 0) return;
  const lista = { $in: faltando };
  for (const modelo of [Magazine, Catalog, Cycle, Article]) {
    await (modelo as typeof Magazine).updateMany({ coverImage: lista }, { $set: { coverImage: '' } });
  }
  await Film.updateMany({ image: lista }, { $set: { image: '' } });
  await Article.updateMany({ images: lista }, { $pull: { images: lista } });
  for (const modelo of [Article, About]) {
    await (modelo as typeof Article).updateMany({ 'blocks.src': lista }, { $pull: { blocks: { type: 'image', src: lista } } });
  }
}

/**
 * Confere a demonstração: banco vazio ou prazo do último reset vencido → restaura tudo;
 * imagem enviada que sumiu do disco → só retira a referência (neutralizarUploadsFaltando).
 * Com DEMO_RESET_MINUTOS=0 (uso local) só popula banco vazio.
 */
export async function conferirDemonstracao({
  agora = new Date(),
  env = process.env,
  pasta = pastaUploads(),
  log = console.log,
  avisarSite = avisarSitePadrao,
}: {
  agora?: Date;
  env?: NodeJS.ProcessEnv;
  pasta?: string;
  log?: (m: string) => void;
  avisarSite?: () => Promise<void>;
} = {}): Promise<'restaurado' | 'reparado' | 'mantido' | 'criado'> {
  const minutos = intervaloResetMinutos(env);
  const vazio = (await restaurarDemonstracao({ soSeVazio: true, log: () => {}, pasta })) === 'restaurado';
  if (vazio) {
    await gravarUltimoReset(agora);
    log('Demonstração: banco vazio, dados de exemplo criados.');
    return 'criado';
  }
  if (minutos === 0) return 'mantido';

  if (resetVencido(await lerUltimoReset(), agora, minutos)) {
    await restaurarDemonstracao({ soSeVazio: false, log: () => {}, pasta });
    await gravarUltimoReset(agora);
    log(`Demonstração restaurada aos dados de exemplo (passaram ${minutos} min).`);
    await avisarSite().catch(() => {});
    return 'restaurado';
  }

  // Disco efêmero: uploads que sumiram (servidor dormiu) saem do conteúdo, sem reset completo
  const faltando = await uploadsFaltando(pasta);
  if (faltando.length === 0) return 'mantido';
  await neutralizarUploadsFaltando(faltando);
  log(`Demonstração: ${faltando.length} imagem(ns) enviada(s) sumiram do disco; as referências foram retiradas.`);
  await avisarSite().catch(() => {});
  return 'reparado';
}

/** Confere a demonstração a cada 5 minutos; devolve a função que para o agendamento */
export function agendarConferenciaDemonstracao(log: (m: string) => void = console.log) {
  const t = setInterval(
    () => {
      conferirDemonstracao({ log }).catch((e) => log(`Falha ao conferir a demonstração: ${(e as Error).message}`));
    },
    5 * 60 * 1000
  );
  t.unref();
  return () => clearInterval(t);
}
