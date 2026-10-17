/** Item do menu do celular (site e painel) */
export interface ItemDoMenu {
  href: string;
  rotulo: string;
  /** só a própria página marca o link (ex.: início do painel) */
  exato?: boolean;
  /** outras áreas que também marcam este link (ex.: textos de revista em "revistas") */
  tambem?: string[];
  /** abre em nova aba e nunca fica marcado */
  externo?: boolean;
}

const dentroDe = (base: string, caminho: string) => caminho === base || caminho.startsWith(`${base}/`);

/** O link marca a página atual? */
export function linkAtivo(item: ItemDoMenu, caminho: string): boolean {
  if (item.externo) return false;
  if (item.exato) return caminho === item.href;
  return dentroDe(item.href, caminho) || (item.tambem ?? []).some((base) => dentroDe(base, caminho));
}
