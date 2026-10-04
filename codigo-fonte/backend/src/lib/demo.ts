import Magazine from '../models/Magazine';
import Article from '../models/Article';
import Catalog from '../models/Catalog';
import Cycle from '../models/Cycle';
import Film from '../models/Film';
import About from '../models/About';
import { executarSeed } from '../scripts/seed';

/**
 * Modo demonstração: só para o ambiente hospedado da demonstração (banco SÓ de exemplo).
 * Desligado por padrão; liga com DEMO_ENABLED=true. Com ele:
 *  - GET /api/demo descreve o papel de demonstração (sem senha nenhuma);
 *  - POST /api/demo/entrar emite um token de editor com um clique;
 *  - os dados voltam ao exemplo periodicamente (DEMO_RESET_MINUTOS, padrão 360).
 * Nunca ligue num banco com conteúdo real: o reset apaga tudo.
 */
export function demoLigado(env: NodeJS.ProcessEnv = process.env): boolean {
  return ['true', '1', 'sim'].includes(String(env.DEMO_ENABLED ?? '').toLowerCase());
}

export const intervaloResetMinutos = (env: NodeJS.ProcessEnv = process.env) => Math.max(15, Number(env.DEMO_RESET_MINUTOS) || 360);

const COLECOES = [Magazine, Article, Catalog, Cycle, Film, About];

/** Repõe os dados de exemplo. soSeVazio: só popula se o banco estiver vazio (primeira partida). */
export async function restaurarDemonstracao({ soSeVazio, log = console.log }: { soSeVazio: boolean; log?: (m: string) => void }) {
  if (soSeVazio) {
    const total = (await Promise.all(COLECOES.map((m) => (m as typeof Magazine).countDocuments()))).reduce((a, b) => a + b, 0);
    if (total > 0) return 'mantido' as const;
  }
  await executarSeed({ banco: 'demonstração', force: true, confirmar: async () => true, log });
  return 'restaurado' as const;
}

/** Agenda o reset periódico da demonstração; devolve a função que para o agendamento */
export function agendarResetDemonstracao(log: (m: string) => void = console.log) {
  const minutos = intervaloResetMinutos();
  const t = setInterval(() => {
    restaurarDemonstracao({ soSeVazio: false, log: () => {} })
      .then(() => log(`Demonstração restaurada aos dados de exemplo (a cada ${minutos} min).`))
      .catch((e) => log(`Falha ao restaurar a demonstração: ${(e as Error).message}`));
  }, minutos * 60 * 1000);
  t.unref();
  return () => clearInterval(t);
}
