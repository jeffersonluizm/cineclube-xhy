import { Router } from 'express';
import Catalog from '../models/Catalog';
import Article from '../models/Article';
import { assincrono, naoEncontrado } from '../middleware/erros';
import { agruparPor, CAMPOS_SUMARIO, paraSumario, textosPublicados, vizinhos } from '../lib/conteudo';

const router = Router();

async function catalogoPeloSlug(slug: string) {
  const catalog = await Catalog.findOne({ slug }).lean();
  if (!catalog) throw naoEncontrado('Catálogo não encontrado');
  return catalog;
}

router.get(
  '/',
  assincrono(async (_req, res) => {
    res.json(await Catalog.find().sort({ year: -1 }).lean());
  })
);

router.get(
  '/:slug',
  assincrono(async (req, res) => {
    const catalog = await catalogoPeloSlug(req.params.slug);
    const articles = await Article.find(textosPublicados('catalogo', catalog._id))
      .sort({ order: 1 })
      .select(CAMPOS_SUMARIO)
      .lean<{ column: string; content?: string }[]>();
    res.json({ catalog, sections: agruparPor(articles.map(paraSumario), 'column') });
  })
);

router.get(
  '/:slug/texto/:textSlug',
  assincrono(async (req, res) => {
    const catalog = await catalogoPeloSlug(req.params.slug);
    const article = await Article.findOne({ slug: req.params.textSlug, parentId: catalog._id, published: { $ne: false } }).lean();
    if (!article) throw naoEncontrado('Texto não encontrado');

    const todos = await Article.find(textosPublicados('catalogo', catalog._id))
      .sort({ order: 1 })
      .select('title slug author')
      .lean<{ title: string; slug: string; author: string }[]>();
    res.json({ article, catalog, ...vizinhos(todos, req.params.textSlug, ['title', 'slug', 'author']) });
  })
);

export default router;
