import { Router } from 'express';
import Cycle from '../models/Cycle';
import Film from '../models/Film';
import Article from '../models/Article';
import { assincrono, naoEncontrado } from '../middleware/erros';
import { agruparPor, CAMPOS_SUMARIO, paraSumario, textosPublicados, vizinhos } from '../lib/conteudo';

const router = Router();

async function cicloPeloSlug(slug: string) {
  const cycle = await Cycle.findOne({ slug }).lean();
  if (!cycle) throw naoEncontrado('Ciclo não encontrado');
  return cycle;
}

router.get(
  '/',
  assincrono(async (_req, res) => {
    res.json(await Cycle.find().sort({ year: -1 }).lean());
  })
);

router.get(
  '/:slug',
  assincrono(async (req, res) => {
    const cycle = await cicloPeloSlug(req.params.slug);
    const [films, articles] = await Promise.all([
      Film.find({ cycleId: cycle._id }).sort({ order: 1 }).select('title slug director year duration country order').lean(),
      Article.find(textosPublicados('ciclo', cycle._id))
        .sort({ order: 1 })
        .select(CAMPOS_SUMARIO)
        .lean<{ column: string; content?: string }[]>(),
    ]);
    // Textos do ciclo agrupados por coluna, no mesmo formato da página de catálogo
    res.json({ cycle, films, sections: agruparPor(articles.map(paraSumario), 'column') });
  })
);

router.get(
  '/:slug/filme/:filmSlug',
  assincrono(async (req, res) => {
    const cycle = await cicloPeloSlug(req.params.slug);
    const film = await Film.findOne({ slug: req.params.filmSlug, cycleId: cycle._id }).lean();
    if (!film) throw naoEncontrado('Filme não encontrado');

    const todos = await Film.find({ cycleId: cycle._id })
      .sort({ order: 1 })
      .select('title slug director')
      .lean<{ title: string; slug: string; director: string }[]>();
    res.json({ film, cycle, ...vizinhos(todos, req.params.filmSlug, ['title', 'slug', 'director']) });
  })
);

router.get(
  '/:slug/texto/:textSlug',
  assincrono(async (req, res) => {
    const cycle = await cicloPeloSlug(req.params.slug);
    const article = await Article.findOne({ ...textosPublicados('ciclo', cycle._id), slug: req.params.textSlug }).lean();
    if (!article) throw naoEncontrado('Texto não encontrado');

    const todos = await Article.find(textosPublicados('ciclo', cycle._id))
      .sort({ order: 1 })
      .select('title slug author')
      .lean<{ title: string; slug: string; author: string }[]>();
    res.json({ article, cycle, ...vizinhos(todos, req.params.textSlug, ['title', 'slug', 'author']) });
  })
);

export default router;
