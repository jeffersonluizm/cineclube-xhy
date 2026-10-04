import { Router } from 'express';
import Magazine from '../../models/Magazine';
import Article from '../../models/Article';
import { assincrono, ErroHttp, naoEncontrado } from '../../middleware/erros';
import { slugify } from '../../lib/slugify';
import { soDefinidos } from '../../lib/conteudo';

const router = Router();
const duplicada = (err: unknown) => (err as { code?: number }).code === 11000;

router.get(
  '/',
  assincrono(async (_req, res) => {
    res.json(await Magazine.find().sort({ number: -1 }));
  })
);

router.post(
  '/',
  assincrono(async (req, res) => {
    const { number, volume, month, year, coverImage, editorial } = req.body;
    if (number == null || volume == null || !month || year == null) {
      throw new ErroHttp(400, 'Preencha número, volume, mês e ano');
    }
    try {
      const magazine = await Magazine.create({ number, volume, month, year, coverImage, editorial, slug: slugify(`revista-${number}`) });
      res.status(201).json(magazine);
    } catch (err) {
      if (duplicada(err)) throw new ErroHttp(409, 'Já existe uma revista com esse número');
      throw err;
    }
  })
);

router.put(
  '/:id',
  assincrono(async (req, res) => {
    const { number, volume, month, year, coverImage, editorial } = req.body;
    const update: Record<string, unknown> = soDefinidos({ number, volume, month, year, coverImage, editorial });
    if (number != null) update.slug = slugify(`revista-${number}`);
    const magazine = await Magazine.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!magazine) throw naoEncontrado('Revista não encontrada');
    res.json(magazine);
  })
);

router.delete(
  '/:id',
  assincrono(async (req, res) => {
    const magazine = await Magazine.findByIdAndDelete(req.params.id);
    if (!magazine) throw naoEncontrado('Revista não encontrada');
    await Article.deleteMany({ parentId: magazine._id, parentType: 'revista' });
    res.json({ ok: true });
  })
);

export default router;
