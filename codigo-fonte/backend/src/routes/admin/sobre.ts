import { Router } from 'express';
import About from '../../models/About';
import { assincrono } from '../../middleware/erros';
import { textoCorrido } from '../../lib/conteudo';
import { sobre } from '../../validacao/esquemas';
import { ATUALIZAR } from './comum';

const router = Router();

router.get(
  '/',
  assincrono(async (_req, res) => {
    const about = await About.findOne();
    res.json(about || { content: '', blocks: [], team: [] });
  })
);

router.put(
  '/',
  assincrono(async (req, res) => {
    const { blocks, team } = sobre.parse(req.body ?? {});
    const update = { blocks, content: textoCorrido(blocks), team: team ?? [] };
    res.json(await About.findOneAndUpdate({}, update, { ...ATUALIZAR, upsert: true }));
  })
);

export default router;
