import { Router } from 'express';
import Cycle from '../models/Cycle';
import Film from '../models/Film';
import Article from '../models/Article';
import { assincrono, naoEncontrado } from '../middleware/erros';
import { agruparPor, textosPublicados, vizinhos } from '../lib/conteudo';

const router = Router();

async function cicloPeloSlug(slug: string) {
  const cycle = await Cycle.findOne({ slug });
  if (!cycle) throw naoEncontrado('Ciclo não encontrado');
  return cycle;
}

router.get(
  '/',
  assincrono(async (_req, res) => {
    res.json(await Cycle.find().sort({ year: -1 }));
  })
);

router.get(
  '/:slug',
  assincrono(async (req, res) => {
    const cycle = await cicloPeloSlug(req.params.slug);
    const films = await Film.find({ cycleId: cycle._id }).sort({ order: 1 });
    const articles = await Article.find(textosPublicados('ciclo', cycle._id)).sort({ order: 1 });
    // Textos do ciclo agrupados por coluna, no mesmo formato da página de catálogo
    res.json({ cycle, films, sections: agruparPor(articles, 'column') });
  })
);

router.get(
  '/:slug/filme/:filmSlug',
  assincrono(async (req, res) => {
    const cycle = await cicloPeloSlug(req.params.slug);
    const film = await Film.findOne({ slug: req.params.filmSlug, cycleId: cycle._id });
    if (!film) throw naoEncontrado('Filme não encontrado');

    const todos = await Film.find({ cycleId: cycle._id }).sort({ order: 1 });
    res.json({ film, cycle, ...vizinhos(todos, req.params.filmSlug, ['title', 'slug', 'director']) });
  })
);

router.get(
  '/:slug/texto/:textSlug',
  assincrono(async (req, res) => {
    const cycle = await cicloPeloSlug(req.params.slug);
    const article = await Article.findOne({ ...textosPublicados('ciclo', cycle._id), slug: req.params.textSlug });
    if (!article) throw naoEncontrado('Texto não encontrado');

    const todos = await Article.find(textosPublicados('ciclo', cycle._id)).sort({ order: 1 });
    res.json({ article, cycle, ...vizinhos(todos, req.params.textSlug, ['title', 'slug', 'author']) });
  })
);

export default router;
