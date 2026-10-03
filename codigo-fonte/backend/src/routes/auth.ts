import { Router, Request, Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import { timingSafeEqual } from 'crypto';
import { signToken } from '../middleware/auth';

const router = Router();

// Protege a senha única do editor contra tentativas em massa:
// no máximo 10 tentativas por IP a cada 15 minutos
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: 'Muitas tentativas de login. Aguarde alguns minutos e tente novamente.' },
});

function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

router.post('/login', loginLimiter, (req: Request, res: Response) => {
  const { password } = req.body as { password?: string };
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return res.status(500).json({ error: 'ADMIN_PASSWORD não configurado no servidor' });
  }

  if (!password || !safeEqual(password, adminPassword)) {
    return res.status(401).json({ error: 'Senha incorreta' });
  }

  res.json({ token: signToken() });
});

export default router;
