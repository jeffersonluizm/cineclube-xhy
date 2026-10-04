import { Router, Request, Response } from 'express';
import { signToken, VALIDADE_TOKEN_S } from '../middleware/auth';
import { limitadorLogin } from '../middleware/limitadores';
import { senhaConfere } from '../lib/senha';

const router = Router();

router.post('/login', limitadorLogin, (req: Request, res: Response) => {
  const { password } = (req.body ?? {}) as { password?: unknown };
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return res.status(500).json({ error: 'ADMIN_PASSWORD não configurado no servidor' });
  }

  if (typeof password !== 'string' || !senhaConfere(password, adminPassword)) {
    return res.status(401).json({ error: 'Senha incorreta' });
  }

  res.json({ token: signToken(), expiraEm: VALIDADE_TOKEN_S });
});

export default router;
