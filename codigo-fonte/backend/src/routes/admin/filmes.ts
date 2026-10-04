import { Router } from 'express';
import Film from '../../models/Film';
import { assincrono, ErroHttp, naoEncontrado } from '../../middleware/erros';
import { slugUnico } from '../../lib/slugUnico';
import { soDefinidos } from '../../lib/conteudo';
import { proximaOrdem, rotaReordenar } from './comum';

const router = Router();

router.get(
  '/',
  assincrono(async (req, res) => {
    const filter: Record<string, unknown> = {};
    if (req.query.cycleId) filter.cycleId = req.query.cycleId;
    res.json(await Film.find(filter).sort({ order: 1, createdAt: -1 }));
  })
);

rotaReordenar(router, Film);

router.get(
  '/:id',
  assincrono(async (req, res) => {
    const film = await Film.findById(req.params.id);
    if (!film) throw naoEncontrado('Filme não encontrado');
    res.json(film);
  })
);

router.post(
  '/',
  assincrono(async (req, res) => {
    const { title, director, year, duration, country, image, synopsis, content, author, authorFootnote, epigraph, footnotes, cycleId } = req.body;
    if (!title || !director || year == null || !duration || !country || !synopsis || !cycleId) {
      throw new ErroHttp(400, 'Preencha título, direção, ano, duração, país, sinopse e o ciclo');
    }
    const film = await Film.create({
      title,
      director,
      year,
      duration,
      country,
      image,
      synopsis,
      content,
      author,
      authorFootnote,
      epigraph,
      footnotes: footnotes || [],
      cycleId,
      slug: await slugUnico(Film, title),
      order: await proximaOrdem(Film, { cycleId }),
    });
    res.status(201).json(film);
  })
);

router.put(
  '/:id',
  assincrono(async (req, res) => {
    const { title, director, year, duration, country, image, synopsis, content, author, authorFootnote, epigraph, footnotes } = req.body;
    const update = soDefinidos({ title, director, year, duration, country, image, synopsis, content, author, authorFootnote, epigraph, footnotes });
    const film = await Film.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!film) throw naoEncontrado('Filme não encontrado');
    res.json(film);
  })
);

router.delete(
  '/:id',
  assincrono(async (req, res) => {
    const film = await Film.findByIdAndDelete(req.params.id);
    if (!film) throw naoEncontrado('Filme não encontrado');
    res.json({ ok: true });
  })
);

export default router;
