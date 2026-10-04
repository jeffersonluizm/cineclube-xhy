import { Router } from 'express';
import Catalog from '../../models/Catalog';
import Article from '../../models/Article';
import { assincrono, ErroHttp, naoEncontrado } from '../../middleware/erros';
import { slugUnico } from '../../lib/slugUnico';
import { soDefinidos } from '../../lib/conteudo';

const router = Router();

router.get(
  '/',
  assincrono(async (_req, res) => {
    res.json(await Catalog.find().sort({ year: -1, createdAt: -1 }));
  })
);

router.post(
  '/',
  assincrono(async (req, res) => {
    const { title, year, coverImage, description } = req.body;
    if (!title || year == null) throw new ErroHttp(400, 'Preencha título e ano');
    const catalog = await Catalog.create({ title, year, coverImage, description, slug: await slugUnico(Catalog, title) });
    res.status(201).json(catalog);
  })
);

router.put(
  '/:id',
  assincrono(async (req, res) => {
    const { title, year, coverImage, description } = req.body;
    const catalog = await Catalog.findByIdAndUpdate(req.params.id, soDefinidos({ title, year, coverImage, description }), { new: true });
    if (!catalog) throw naoEncontrado('Catálogo não encontrado');
    res.json(catalog);
  })
);

router.delete(
  '/:id',
  assincrono(async (req, res) => {
    const catalog = await Catalog.findByIdAndDelete(req.params.id);
    if (!catalog) throw naoEncontrado('Catálogo não encontrado');
    await Article.deleteMany({ parentId: catalog._id, parentType: 'catalogo' });
    res.json({ ok: true });
  })
);

export default router;
