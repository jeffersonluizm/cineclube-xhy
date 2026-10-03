import { Router, Request, Response } from 'express';
import About from '../models/About';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const about = await About.findOne();
    if (!about) return res.status(404).json({ error: 'Dados não encontrados' });
    res.json(about);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar dados' });
  }
});

export default router;
