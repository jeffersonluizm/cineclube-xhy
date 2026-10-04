import { Router, Request, Response } from 'express';
import Cycle from '../models/Cycle';
import Film from '../models/Film';
import Article from '../models/Article';

const router = Router();

// Só textos publicados que pertencem a este ciclo (rascunhos ficam no painel)
const textosPublicados = (cycleId: unknown) => ({ parentId: cycleId, parentType: 'ciclo', published: { $ne: false } });

router.get('/', async (_req: Request, res: Response) => {
  try {
    const cycles = await Cycle.find().sort({ year: -1 });
    res.json(cycles);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar ciclos' });
  }
});

router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const cycle = await Cycle.findOne({ slug: req.params.slug });
    if (!cycle) return res.status(404).json({ error: 'Ciclo não encontrado' });

    const films = await Film.find({ cycleId: cycle._id }).sort({ order: 1 });
    const articles = await Article.find(textosPublicados(cycle._id)).sort({ order: 1 });

    // Textos do ciclo agrupados por coluna, no mesmo formato da página de catálogo
    const sections: Record<string, typeof articles> = {};
    for (const article of articles) {
      if (!sections[article.column]) sections[article.column] = [];
      sections[article.column].push(article);
    }

    res.json({ cycle, films, sections });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar ciclo' });
  }
});

router.get('/:slug/filme/:filmSlug', async (req: Request, res: Response) => {
  try {
    const cycle = await Cycle.findOne({ slug: req.params.slug });
    if (!cycle) return res.status(404).json({ error: 'Ciclo não encontrado' });

    const film = await Film.findOne({ slug: req.params.filmSlug, cycleId: cycle._id });
    if (!film) return res.status(404).json({ error: 'Filme não encontrado' });

    const allFilms = await Film.find({ cycleId: cycle._id }).sort({ order: 1 });
    const idx = allFilms.findIndex((f) => f.slug === req.params.filmSlug);

    const prev = idx > 0 ? { title: allFilms[idx - 1].title, slug: allFilms[idx - 1].slug, director: allFilms[idx - 1].director } : null;
    const next = idx < allFilms.length - 1 ? { title: allFilms[idx + 1].title, slug: allFilms[idx + 1].slug, director: allFilms[idx + 1].director } : null;

    res.json({ film, cycle, prev, next });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar filme' });
  }
});

router.get('/:slug/texto/:textSlug', async (req: Request, res: Response) => {
  try {
    const cycle = await Cycle.findOne({ slug: req.params.slug });
    if (!cycle) return res.status(404).json({ error: 'Ciclo não encontrado' });

    const article = await Article.findOne({ ...textosPublicados(cycle._id), slug: req.params.textSlug });
    if (!article) return res.status(404).json({ error: 'Texto não encontrado' });

    const allArticles = await Article.find(textosPublicados(cycle._id)).sort({ order: 1 });
    const idx = allArticles.findIndex((a) => a.slug === req.params.textSlug);

    const prev = idx > 0 ? { title: allArticles[idx - 1].title, slug: allArticles[idx - 1].slug, author: allArticles[idx - 1].author } : null;
    const next = idx < allArticles.length - 1 ? { title: allArticles[idx + 1].title, slug: allArticles[idx + 1].slug, author: allArticles[idx + 1].author } : null;

    res.json({ article, cycle, prev, next });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar texto' });
  }
});

export default router;
