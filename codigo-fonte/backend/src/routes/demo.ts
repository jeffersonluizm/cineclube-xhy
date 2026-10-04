import { Router } from 'express';
import { z } from 'zod';
import { assincrono, naoEncontrado } from '../middleware/erros';
import { signToken, VALIDADE_TOKEN_S } from '../middleware/auth';
import { demoLigado, intervaloResetMinutos } from '../lib/demo';

/** Fonte única do modo demonstração para o site (404 com a flag desligada) */
const router = Router();

const PAPEIS = [
  {
    papel: 'editor',
    rotulo: 'Entrar no painel como editor de demonstração',
    descricao: 'Publica e organiza revistas, catálogos, exibições e textos. Os dados de exemplo voltam ao original periodicamente.',
  },
];

const exigirDemo = assincrono(async (_req, _res, next) => {
  if (!demoLigado()) throw naoEncontrado('Rota não encontrada');
  next();
});

router.get('/', exigirDemo, (_req, res) => {
  res.json({ ativo: true, papeis: PAPEIS, resetMinutos: intervaloResetMinutos() });
});

const pedido = z.object({ papel: z.enum(['editor'], { error: 'Papel de demonstração desconhecido' }) });

router.post(
  '/entrar',
  exigirDemo,
  assincrono(async (req, res) => {
    pedido.parse(req.body ?? {});
    res.json({ token: signToken(), expiraEm: VALIDADE_TOKEN_S, demo: true });
  })
);

export default router;
