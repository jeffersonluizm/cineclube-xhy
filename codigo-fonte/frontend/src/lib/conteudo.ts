/** Regras de apresentação do conteúdo compartilhadas pelas páginas */

/** Agrupa por ano (mais recente primeiro), mantendo a ordem de chegada dentro de cada ano */
export function agruparPorAno<T extends { year: number }>(itens: T[]): [number, T[]][] {
  const grupos = new Map<number, T[]>();
  for (const item of itens) {
    if (!grupos.has(item.year)) grupos.set(item.year, []);
    grupos.get(item.year)!.push(item);
  }
  return Array.from(grupos.entries()).sort(([a], [b]) => b - a);
}

/**
 * Filme com página para uma sessão da programação: pelo id (sessões novas) ou, nas
 * sessões antigas sem id, pelo slug gerado a partir do título.
 */
export function filmeDaSessao<F extends { _id: string; slug: string }>(
  sessao: { filmId?: string; filmSlug?: string },
  filmes: F[]
): F | undefined {
  if (sessao.filmId) return filmes.find((f) => f._id === sessao.filmId);
  if (sessao.filmSlug) return filmes.find((f) => f.slug === sessao.filmSlug);
  return undefined;
}

/** Âncora de uma nota de rodapé e da sua chamada no texto */
export const idNota = (n: number) => `nota-${n}`;
export const idChamada = (n: number) => `chamada-${n}`;
