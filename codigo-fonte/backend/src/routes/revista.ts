import { Router, Request, Response } from 'express';
import Magazine from '../models/Magazine';
import Article from '../models/Article';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const magazines = await Magazine.find().sort({ number: -1 });
    res.json(magazines);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar revistas' });
  }
});

router.get('/:number', async (req: Request, res: Response) => {
  try {
    const magazine = await Magazine.findOne({ number: Number(req.params.number) });
    if (!magazine) return res.status(404).json({ error: 'Revista não encontrada' });

    const articles = await Article.find({ parentId: magazine._id, parentType: 'revista', published: { $ne: false } }).sort({ order: 1 });

    const columns: Record<string, typeof articles> = {};
    for (const article of articles) {
      if (!columns[article.column]) columns[article.column] = [];
      columns[article.column].push(article);
    }

    res.json({ magazine, columns });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar revista' });
  }
});

router.get('/:number/artigo/:slug', async (req: Request, res: Response) => {
  try {
    const magazine = await Magazine.findOne({ number: Number(req.params.number) });
    if (!magazine) return res.status(404).json({ error: 'Revista não encontrada' });

    const article = await Article.findOne({ slug: req.params.slug, parentId: magazine._id, published: { $ne: false } });
    if (!article) return res.status(404).json({ error: 'Artigo não encontrado' });

    const allArticles = await Article.find({ parentId: magazine._id, parentType: 'revista', published: { $ne: false } }).sort({ order: 1 });
    const idx = allArticles.findIndex((a) => a.slug === req.params.slug);

    const prev = idx > 0 ? { title: allArticles[idx - 1].title, slug: allArticles[idx - 1].slug, author: allArticles[idx - 1].author } : null;
    const next = idx < allArticles.length - 1 ? { title: allArticles[idx + 1].title, slug: allArticles[idx + 1].slug, author: allArticles[idx + 1].author } : null;

    res.json({ article, magazine, prev, next });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar artigo' });
  }
});

export default router;
