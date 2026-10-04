import type { Request } from 'express';
import { createHash, timingSafeEqual } from 'crypto';
import { rateLimit } from 'express-rate-limit';

const mensagem = (texto: string) => ({ error: texto });
const hash = (s: string) => createHash('sha256').update(s, 'utf8').digest();

/**
 * O servidor do site (Next) busca os dados em nome de todos os visitantes, do mesmo IP.
 * Ele se identifica com o cabeçalho X-Servidor-Site, que carrega um segredo só do servidor
 * (SERVIDOR_SEGREDO, nunca NEXT_PUBLIC_*). Comparação em tempo constante.
 */
export function pedidoDoServidorDoSite(req: Request, segredo = process.env.SERVIDOR_SEGREDO): boolean {
  const enviado = req.headers['x-servidor-site'];
  if (!segredo || typeof enviado !== 'string' || !enviado) return false;
  return timingSafeEqual(hash(enviado), hash(segredo));
}

/**
 * Limite geral por IP para toda a API (requisições por minuto). 0 desliga: a carga
 * desliga para medir vazão e mede os limitadores à parte. O servidor do site fica de
 * fora (senão um visitante abusivo derrubaria o site para todos); o abuso no site é
 * contido pelo middleware do Next, que limita por IP do visitante.
 */
export function criarLimitadorGeral(porMinuto: number, segredoDoSite = process.env.SERVIDOR_SEGREDO) {
  return rateLimit({
    windowMs: 60 * 1000,
    limit: porMinuto,
    skip: (req) => porMinuto <= 0 || pedidoDoServidorDoSite(req, segredoDoSite),
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: mensagem('Muitas requisições. Aguarde um minuto e tente novamente.'),
  });
}

/** Login: no máximo 10 tentativas erradas por IP a cada 15 minutos */
export const limitadorLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: mensagem('Muitas tentativas de login. Aguarde alguns minutos e tente novamente.'),
});

/**
 * Teto de logins errados somando todos os IPs (força bruta distribuída): por hora.
 * Quem tem a senha certa continua entrando (sucessos não contam).
 */
export function criarLimitadorLoginGlobal(porHora = 100) {
  return rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: porHora,
    keyGenerator: () => 'todos',
    skipSuccessfulRequests: true,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: mensagem('O painel recebeu muitas tentativas de login erradas. Tente de novo mais tarde.'),
  });
}

/** Upload: 60 imagens por IP a cada 15 minutos (o editor envia poucas por texto) */
export const limitadorUpload = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: mensagem('Muitos envios de imagem seguidos. Aguarde alguns minutos.'),
});
