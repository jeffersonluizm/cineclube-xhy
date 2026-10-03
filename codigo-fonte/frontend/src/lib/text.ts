/** Trecho curto de um texto para usar nas listagens */
export function excerpt(text?: string, max = 90): string {
  if (!text) return '';
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max).replace(/\s\S*$/, '') + '…';
}
