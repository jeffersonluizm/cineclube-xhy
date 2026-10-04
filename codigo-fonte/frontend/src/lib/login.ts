/** Regras da tela de login do painel, separadas da interface para serem testadas */

/**
 * Para onde ir depois de entrar. Só caminhos do próprio painel: um ?next= vindo de um
 * link externo não pode levar o editor para outro site (redirecionamento aberto).
 */
export function destinoSeguro(next: string | null | undefined): string {
  if (!next || !next.startsWith('/admin') || next.startsWith('//')) return '/admin';
  const caminho = next.split(/[?#]/)[0];
  if (caminho === '/admin/login' || caminho === '/admin/sair' || caminho === '/admin/sessao-expirada') return '/admin';
  return next;
}

/** Segundos até poder tentar de novo, pelos cabeçalhos do limite (RateLimit draft-7 ou Retry-After) */
export function segundosParaTentarDeNovo({
  ratelimit,
  retryAfter,
}: {
  ratelimit: string | null;
  retryAfter: string | null;
}): number | null {
  const reset = ratelimit?.match(/reset=(\d+)/);
  if (reset) return Number(reset[1]);
  if (retryAfter && /^\d+$/.test(retryAfter.trim())) return Number(retryAfter);
  return null;
}

export function tempoPorExtenso(segundos: number): string {
  if (segundos < 60) return `${segundos} segundos`;
  const minutos = Math.ceil(segundos / 60);
  return minutos === 1 ? '1 minuto' : `${minutos} minutos`;
}

/** Motivos que a tela de login explica (?motivo=) */
export const MOTIVOS: Record<string, string> = {
  expirada: 'Sua sessão expirou. Entre de novo para continuar de onde parou.',
  saiu: 'Você saiu do painel.',
  necessario: 'Entre com a senha do editor para acessar o painel.',
};
