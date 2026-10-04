import { Router } from 'express';
import About from '../../models/About';
import { assincrono, ErroHttp } from '../../middleware/erros';
import { textoCorrido } from '../../lib/conteudo';

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
    const { blocks, team } = req.body;
    if (!Array.isArray(blocks) || blocks.length === 0) {
      throw new ErroHttp(400, 'Monte o texto de apresentação em ao menos um bloco');
    }
    const update = { blocks, content: textoCorrido(blocks), team: team || [] };
    res.json(await About.findOneAndUpdate({}, update, { new: true, upsert: true }));
  })
);

export default router;
