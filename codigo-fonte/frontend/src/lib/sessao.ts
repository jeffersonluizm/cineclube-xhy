/**
 * Sessão do editor no navegador. O token (JWT de 8 h) fica no localStorage: o painel é
 * uma área de uma pessoa só, sem cookies de terceiros, e a CSP do site restringe de onde
 * vem script. A validade é lida do próprio token só para avisar antes de expirar; quem
 * decide se ele vale é sempre a API.
 */
const CHAVE = 'xhy_editor_token';

export const EVENTO_SESSAO_EXPIRADA = 'xhy:sessao-expirada';
export const EVENTO_SESSAO_RENOVADA = 'xhy:sessao-renovada';

export function lerToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(CHAVE);
  } catch {
    return null;
  }
}

export function guardarToken(token: string) {
  try {
    localStorage.setItem(CHAVE, token);
  } catch {
    /* navegador sem armazenamento: a sessão dura até fechar a aba */
  }
  window.dispatchEvent(new Event(EVENTO_SESSAO_RENOVADA));
}

export function apagarToken() {
  try {
    localStorage.removeItem(CHAVE);
  } catch {
    /* nada a apagar */
  }
}

/** Campo exp (segundos) do payload do JWT, ou null se o token não tiver o formato esperado */
export function expiracaoDoToken(token: string | null): number | null {
  if (!token) return null;
  const partes = token.split('.');
  if (partes.length !== 3) return null;
  try {
    const base64 = partes[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = typeof atob === 'function' ? atob(base64) : Buffer.from(base64, 'base64').toString('utf8');
    const exp = (JSON.parse(json) as { exp?: unknown }).exp;
    return typeof exp === 'number' ? exp : null;
  } catch {
    return null;
  }
}

export function segundosRestantes(token: string | null, agoraMs = Date.now()): number {
  const exp = expiracaoDoToken(token);
  if (!exp) return 0;
  return Math.max(0, Math.floor(exp - agoraMs / 1000));
}
