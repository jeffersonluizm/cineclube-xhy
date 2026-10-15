import Magazine from '../models/Magazine';
import Article from '../models/Article';
import Catalog from '../models/Catalog';
import Cycle from '../models/Cycle';
import Film from '../models/Film';
import About from '../models/About';
import fs from 'fs';
import path from 'path';
import { executarSeed } from '../scripts/seed';
import { pastaUploads } from './uploads';

/**
 * Modo demonstração: só para o ambiente hospedado da demonstração (banco SÓ de exemplo).
 * Desligado por padrão; liga com DEMO_ENABLED=true. Com ele:
 *  - GET /api/demo descreve o papel de demonstração (sem senha nenhuma);
 *  - POST /api/demo/entrar emite um token de editor com um clique;
 *  - os dados voltam ao exemplo periodicamente (DEMO_RESET_MINUTOS, padrão 60), e as imagens
 *    enviadas (pasta uploads/demo, até 2 MB, poucas por hora) são apagadas junto;
 *  - a API só parte se o banco tiver "demo" no nome (bancoAceitaDemonstracao).
 * Nunca ligue num banco com conteúdo real: o reset apaga tudo.
 */
export function demoLigado(env: NodeJS.ProcessEnv = process.env): boolean {
  return ['true', '1', 'sim'].includes(String(env.DEMO_ENABLED ?? '').toLowerCase());
}

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

/** Repõe os dados de exemplo. soSeVazio: só popula se o banco estiver vazio (primeira partida). */
export async function restaurarDemonstracao({ soSeVazio, log = console.log }: { soSeVazio: boolean; log?: (m: string) => void }) {
  if (soSeVazio) {
    const total = (await Promise.all(COLECOES.map((m) => (m as typeof Magazine).countDocuments()))).reduce((a, b) => a + b, 0);
    if (total > 0) return 'mantido' as const;
  }
  await executarSeed({ banco: 'demonstração', force: true, confirmar: async () => true, log });
  if (!soSeVazio) await limparUploadsDemonstracao();
  return 'restaurado' as const;
}

/** Agenda o reset periódico da demonstração; devolve a função que para o agendamento */
export function agendarResetDemonstracao(log: (m: string) => void = console.log) {
  const minutos = intervaloResetMinutos();
  if (minutos === 0) return () => {};
  const t = setInterval(
    () => {
      restaurarDemonstracao({ soSeVazio: false, log: () => {} })
        .then(() => log(`Demonstração restaurada aos dados de exemplo (a cada ${minutos} min).`))
        .catch((e) => log(`Falha ao restaurar a demonstração: ${(e as Error).message}`));
    },
    minutos * 60 * 1000
  );
  t.unref();
  return () => clearInterval(t);
}
