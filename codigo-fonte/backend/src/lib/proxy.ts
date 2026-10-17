import type { NextFunction, Request, Response } from 'express';

/**
 * Quantos proxies ficam na frente da API (o Render põe a própria borda e a da Cloudflare).
 * O Express usa esse número para achar o IP real do visitante no X-Forwarded-For; errado
 * para menos, o limite por IP conta o IP de um proxy e mistura visitantes. Nunca use
 * "true": aí o visitante poderia forjar o próprio IP no cabeçalho.
 */
export function proxiesConfiaveis(env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env): number {
  const valor = env.PROXIES_CONFIAVEIS;
  if (valor === undefined || !/^\d$/.test(valor)) return 1;
  const n = Number(valor);
  return n <= 5 ? n : 1;
}

/**
 * Diagnóstico de uma vez por processo: quantos endereços chegam no X-Forwarded-For.
 * Serve para acertar PROXIES_CONFIAVEIS; mostra só a contagem, nunca os IPs.
 */
export function registrarSaltosDoProxy(confiaveis: number, log: (m: string) => void = console.log) {
  let registrado = false;
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!registrado) {
      registrado = true;
      const enderecos = String(req.headers['x-forwarded-for'] ?? '')
        .split(',')
        .filter((parte) => parte.trim()).length;
      log(`[proxy] X-Forwarded-For com ${enderecos} endereço(s); PROXIES_CONFIAVEIS=${confiaveis}`);
    }
    next();
  };
}
