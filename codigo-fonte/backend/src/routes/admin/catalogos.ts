import { Router } from 'express';
import Catalog from '../../models/Catalog';
import Article from '../../models/Article';
import { assincrono, naoEncontrado } from '../../middleware/erros';
import { slugUnico } from '../../lib/slugUnico';
import { soDefinidos } from '../../lib/conteudo';
import { catalogoEdicao, catalogoNovo, objectId } from '../../validacao/esquemas';
import { ATUALIZAR, rotaBuscarPorId } from './comum';

const router = Router();

router.get(
  '/',
  assincrono(async (_req, res) => {
    res.json(await Catalog.find().sort({ year: -1, createdAt: -1 }));
  })
);

rotaBuscarPorId(router, Catalog, 'Catálogo não encontrado');

router.get(
  '/:id/impacto',
  assincrono(async (req, res) => {
    const id = objectId.parse(req.params.id);
    res.json({ textos: await Article.countDocuments({ parentId: id, parentType: 'catalogo' }) });
  })
);

router.post(
  '/',
  assincrono(async (req, res) => {
    const dados = catalogoNovo.parse(req.body ?? {});
    const catalog = await Catalog.create({ ...dados, slug: await slugUnico(Catalog, dados.title) });
    res.status(201).json(catalog);
  })
);

router.put(
  '/:id',
  assincrono(async (req, res) => {
    const dados = catalogoEdicao.parse(req.body ?? {});
    const catalog = await Catalog.findByIdAndUpdate(objectId.parse(req.params.id), soDefinidos(dados), ATUALIZAR);
    if (!catalog) throw naoEncontrado('Catálogo não encontrado');
    res.json(catalog);
  })
);

router.delete(
  '/:id',
  assincrono(async (req, res) => {
    const catalog = await Catalog.findByIdAndDelete(objectId.parse(req.params.id));
    if (!catalog) throw naoEncontrado('Catálogo não encontrado');
    await Article.deleteMany({ parentId: catalog._id, parentType: 'catalogo' });
    res.json({ ok: true });
  })
);

export default router;
