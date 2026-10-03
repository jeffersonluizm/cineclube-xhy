import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') {
    // index.ts já aborta a inicialização sem JWT_SECRET; esta é a segunda barreira
    throw new Error('JWT_SECRET não definido em produção');
  }
  return 'segredo-apenas-para-desenvolvimento';
};

export interface AuthRequest extends Request {
  editor?: { role: string };
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  try {
    const payload = jwt.verify(header.slice(7), getSecret()) as { role: string };
    req.editor = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' });
  }
}

export function signToken() {
  return jwt.sign({ role: 'editor' }, getSecret(), { expiresIn: '7d' });
}
