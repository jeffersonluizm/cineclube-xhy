import { Router, Request, Response } from 'express';
import { AuthRequest, requireAuth, signToken, VALIDADE_TOKEN_S } from '../middleware/auth';
import { criarLimitadoresDoLogin } from '../middleware/limitadores';
import { senhaConfere } from '../lib/senha';

const router = Router();

const limitadoresDoLogin = criarLimitadoresDoLogin(Number(process.env.LOGIN_ERRADOS_POR_HORA ?? 100));

router.post('/login', ...limitadoresDoLogin, (req: Request, res: Response) => {
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

/** O painel confere a sessão ao abrir e sabe quando avisar que ela vai expirar */
router.get('/sessao', requireAuth, (req: AuthRequest, res: Response) => {
  res.json({ ok: true, expiraEm: req.editor?.exp });
});

export default router;
