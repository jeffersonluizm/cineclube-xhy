import { Router, Request, Response } from 'express';
import Cycle from '../models/Cycle';
import Film from '../models/Film';

const router = Router();

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
    res.json({ cycle, films });
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

export default router;
