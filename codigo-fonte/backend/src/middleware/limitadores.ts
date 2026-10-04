import { rateLimit } from 'express-rate-limit';

const mensagem = (texto: string) => ({ error: texto });

/**
 * Limite geral por IP para toda a API (requisições por minuto). 0 desliga: a carga
 * desliga para medir vazão e mede os limitadores à parte.
 */
export function criarLimitadorGeral(porMinuto: number) {
  return rateLimit({
    windowMs: 60 * 1000,
    limit: porMinuto,
    skip: () => porMinuto <= 0,
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

/** Upload: 60 imagens por IP a cada 15 minutos (o editor envia poucas por texto) */
export const limitadorUpload = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: mensagem('Muitos envios de imagem seguidos. Aguarde alguns minutos.'),
});
