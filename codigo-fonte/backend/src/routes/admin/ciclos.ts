import { Router } from 'express';
import Cycle from '../../models/Cycle';
import Film from '../../models/Film';
import Article from '../../models/Article';
import { assincrono, ErroHttp, naoEncontrado } from '../../middleware/erros';
import { slugUnico } from '../../lib/slugUnico';
import { soDefinidos } from '../../lib/conteudo';

const router = Router();

router.get(
  '/',
  assincrono(async (_req, res) => {
    res.json(await Cycle.find().sort({ year: -1, createdAt: -1 }));
  })
);

router.post(
  '/',
  assincrono(async (req, res) => {
    const { title, subtitle, year, coverImage, description, author, authorFootnote, epigraph, footnotes, screenings } = req.body;
    if (!title || year == null) throw new ErroHttp(400, 'Preencha título e ano');
    const cycle = await Cycle.create({
      title,
      subtitle,
      year,
      coverImage,
      description,
      author,
      authorFootnote,
      epigraph,
      footnotes: footnotes || [],
      screenings: screenings || [],
      slug: await slugUnico(Cycle, title),
    });
    res.status(201).json(cycle);
  })
);

router.put(
  '/:id',
  assincrono(async (req, res) => {
    const { title, subtitle, year, coverImage, description, author, authorFootnote, epigraph, footnotes, screenings } = req.body;
    const update = soDefinidos({ title, subtitle, year, coverImage, description, author, authorFootnote, epigraph, footnotes, screenings });
    const cycle = await Cycle.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!cycle) throw naoEncontrado('Ciclo não encontrado');
    res.json(cycle);
  })
);

router.delete(
  '/:id',
  assincrono(async (req, res) => {
    const cycle = await Cycle.findByIdAndDelete(req.params.id);
    if (!cycle) throw naoEncontrado('Ciclo não encontrado');
    await Film.deleteMany({ cycleId: cycle._id });
    await Article.deleteMany({ parentId: cycle._id, parentType: 'ciclo' });
    res.json({ ok: true });
  })
);

export default router;
