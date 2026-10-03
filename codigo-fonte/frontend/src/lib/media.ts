export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/** Prefixa URLs relativas de upload (/uploads/…) com o endereço da API */
export function imageUrl(src?: string): string {
  if (!src) return '';
  return src.startsWith('/') ? `${API_URL}${src}` : src;
}
