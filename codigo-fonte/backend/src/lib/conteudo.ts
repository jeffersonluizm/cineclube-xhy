/** Regras de conteúdo compartilhadas pelas rotas públicas e pelo painel. */

/** Texto corrido dos blocos (sem imagens): alimenta trechos, busca e o campo `content` */
export function textoCorrido(blocks?: { type: string; text?: string }[]): string {
  if (!Array.isArray(blocks)) return '';
  return blocks
    .filter((b) => b.type !== 'image' && b.text)
    .map((b) => b.text)
    .join('\n');
}

/** Agrupa mantendo a ordem de chegada (a ordem das colunas segue a do primeiro texto de cada uma) */
export function agruparPor<T, K extends keyof T>(lista: T[], campo: K): Record<string, T[]> {
  const grupos: Record<string, T[]> = {};
  for (const item of lista) {
    const chave = String(item[campo]);
    (grupos[chave] ||= []).push(item);
  }
  return grupos;
}

/** Anterior e próximo de `slug` numa lista já ordenada, só com os campos pedidos */
export function vizinhos<T extends { slug: string }, K extends keyof T>(
  lista: T[],
  slug: string,
  campos: K[]
): { prev: Pick<T, K> | null; next: Pick<T, K> | null } {
  const recorte = (item: T) => Object.fromEntries(campos.map((c) => [c, item[c]])) as Pick<T, K>;
  const i = lista.findIndex((item) => item.slug === slug);
  return {
    prev: i > 0 ? recorte(lista[i - 1]) : null,
    next: i >= 0 && i < lista.length - 1 ? recorte(lista[i + 1]) : null,
  };
}

/** Remove as chaves com valor undefined (o que não veio no PUT não é alterado) */
export function soDefinidos<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}

/** Filtro dos textos publicados de uma revista, catálogo ou ciclo (rascunhos ficam no painel) */
export const textosPublicados = (parentType: 'revista' | 'catalogo' | 'ciclo', parentId: unknown) => ({
  parentId,
  parentType,
  published: { $ne: false },
});

/** Trecho curto de um texto, cortado na última palavra inteira */
export function trecho(texto: string | undefined, max = 220): string {
  const limpo = (texto ?? '').replace(/\s+/g, ' ').trim();
  if (limpo.length <= max) return limpo;
  return limpo.slice(0, max).replace(/\s\S*$/, '') + '…';
}
