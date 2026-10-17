import { siteDeDemonstracao } from './indexacao';

type Ambiente = Record<string, string | undefined>;

/**
 * Extras que só existem na demonstração de portfólio: a página "como foi feito" (arquitetura,
 * testes de carga, limitações) e o RSS. No site do cliente não aparecem: mostrar a arquitetura
 * a qualquer visitante não serve ao público e adianta o trabalho de quem procura falhas.
 */
export function extrasDoPortfolio(env: Ambiente = { NEXT_PUBLIC_DEMO: process.env.NEXT_PUBLIC_DEMO }): boolean {
  return siteDeDemonstracao(env);
}
