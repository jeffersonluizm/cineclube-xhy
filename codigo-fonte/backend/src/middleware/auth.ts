import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createHmac } from 'crypto';

const SEGREDO_DEV = 'segredo-apenas-para-desenvolvimento';

/** Validade do token do editor: um turno de trabalho. O painel avisa antes de expirar. */
export const VALIDADE_TOKEN_S = 8 * 60 * 60;

function bancoLocal(uri?: string): boolean {
  if (!uri) return true; // sem URI a API usa o MongoDB local ou o embutido
  const hosts =
    uri
      .replace(/^mongodb(\+srv)?:\/\//, '')
      .split('/')[0]
      .split('@')
      .pop() ?? '';
  return hosts.split(',').every((h) => /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(h));
}

/**
 * Segredo que assina os tokens. O de desenvolvimento só vale fora de produção E com banco
 * local: uma API ligada a um banco remoto sem JWT_SECRET aceitaria tokens forjados.
 */
export function segredoJwt(env: NodeJS.ProcessEnv = process.env): string {
  if (env.JWT_SECRET) return env.JWT_SECRET;
  if (env.NODE_ENV === 'production' || !bancoLocal(env.MONGODB_URI)) {
    throw new Error('JWT_SECRET não definido: obrigatório em produção e com banco remoto');
  }
  return SEGREDO_DEV;
}

/**
 * Versão da senha do editor gravada no token: trocar ADMIN_PASSWORD invalida na hora
 * todas as sessões abertas com a senha antiga. É um HMAC com o JWT_SECRET: quem obtiver um
 * token não consegue testar senhas offline contra ele (um hash simples permitiria).
 */
export const versaoDaSenha = (senha = process.env.ADMIN_PASSWORD ?? '') =>
  createHmac('sha256', segredoJwt()).update(senha, 'utf8').digest('hex').slice(0, 16);

export interface AuthRequest extends Request {
  editor?: { role: string; exp?: number };
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  try {
    const payload = jwt.verify(header.slice(7), segredoJwt(), { algorithms: ['HS256'] }) as { role: string; exp?: number; v?: string };
    if (payload.role !== 'editor') throw new Error('papel inválido');
    if (payload.v !== versaoDaSenha()) throw new Error('senha do editor foi trocada');
    req.editor = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' });
  }
}

export function signToken() {
  return jwt.sign({ role: 'editor', v: versaoDaSenha() }, segredoJwt(), { expiresIn: VALIDADE_TOKEN_S, algorithm: 'HS256' });
}
