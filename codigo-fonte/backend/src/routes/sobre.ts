import { Router } from 'express';
import About from '../models/About';
import { assincrono, naoEncontrado } from '../middleware/erros';

const router = Router();

router.get(
  '/',
  assincrono(async (_req, res) => {
    const about = await About.findOne();
    if (!about) throw naoEncontrado('Dados não encontrados');
    res.json(about);
  })
);

export default router;
