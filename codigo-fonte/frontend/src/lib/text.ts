/** Trecho curto de um texto para usar nas listagens */
export function excerpt(text?: string, max = 90): string {
  if (!text) return '';
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max).replace(/\s\S*$/, '') + '…';
}

/** Slug do nome do autor: mesma regra do slugify da API (sem acentos, minúsculas, hífens) */
export function slugAutor(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** Valor de um parâmetro de busca da URL: ?q=a&q=b chega como lista; fica o primeiro */
export function primeiroValor(valor: string | string[] | undefined): string {
  if (Array.isArray(valor)) return valor[0] ?? '';
  return valor ?? '';
}
