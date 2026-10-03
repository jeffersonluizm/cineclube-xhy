import { Router, Request, Response } from 'express';
import Catalog from '../models/Catalog';
import Article from '../models/Article';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const catalogs = await Catalog.find().sort({ year: -1 });
    res.json(catalogs);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar catálogos' });
  }
});

router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const catalog = await Catalog.findOne({ slug: req.params.slug });
    if (!catalog) return res.status(404).json({ error: 'Catálogo não encontrado' });

    const articles = await Article.find({ parentId: catalog._id, parentType: 'catalogo', published: { $ne: false } }).sort({ order: 1 });

    const sections: Record<string, typeof articles> = {};
    for (const article of articles) {
      if (!sections[article.column]) sections[article.column] = [];
      sections[article.column].push(article);
    }

    res.json({ catalog, sections });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar catálogo' });
  }
});

router.get('/:slug/texto/:textSlug', async (req: Request, res: Response) => {
  try {
    const catalog = await Catalog.findOne({ slug: req.params.slug });
    if (!catalog) return res.status(404).json({ error: 'Catálogo não encontrado' });

    const article = await Article.findOne({ slug: req.params.textSlug, parentId: catalog._id, published: { $ne: false } });
    if (!article) return res.status(404).json({ error: 'Texto não encontrado' });

    const allArticles = await Article.find({ parentId: catalog._id, parentType: 'catalogo', published: { $ne: false } }).sort({ order: 1 });
    const idx = allArticles.findIndex((a) => a.slug === req.params.textSlug);

    const prev = idx > 0 ? { title: allArticles[idx - 1].title, slug: allArticles[idx - 1].slug, author: allArticles[idx - 1].author } : null;
    const next = idx < allArticles.length - 1 ? { title: allArticles[idx + 1].title, slug: allArticles[idx + 1].slug, author: allArticles[idx + 1].author } : null;

    res.json({ article, catalog, prev, next });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar texto' });
  }
});

export default router;
