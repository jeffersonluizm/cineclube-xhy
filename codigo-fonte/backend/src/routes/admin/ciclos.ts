import { Router } from 'express';
import Cycle from '../../models/Cycle';
import Film from '../../models/Film';
import Article from '../../models/Article';
import { assincrono, naoEncontrado } from '../../middleware/erros';
import { slugUnico } from '../../lib/slugUnico';
import { soDefinidos } from '../../lib/conteudo';
import { cicloEdicao, cicloNovo, objectId } from '../../validacao/esquemas';
import { ATUALIZAR, rotaBuscarPorId } from './comum';

const router = Router();

router.get(
  '/',
  assincrono(async (_req, res) => {
    res.json(await Cycle.find().sort({ year: -1, createdAt: -1 }));
  })
);

rotaBuscarPorId(router, Cycle, 'Ciclo não encontrado');

router.get(
  '/:id/impacto',
  assincrono(async (req, res) => {
    const id = objectId.parse(req.params.id);
    const [textos, filmes] = await Promise.all([
      Article.countDocuments({ parentId: id, parentType: 'ciclo' }),
      Film.countDocuments({ cycleId: id }),
    ]);
    res.json({ textos, filmes });
  })
);

router.post(
  '/',
  assincrono(async (req, res) => {
    const dados = cicloNovo.parse(req.body ?? {});
    const cycle = await Cycle.create({
      ...dados,
      footnotes: dados.footnotes ?? [],
      screenings: dados.screenings ?? [],
      slug: await slugUnico(Cycle, dados.title),
    });
    res.status(201).json(cycle);
  })
);

router.put(
  '/:id',
  assincrono(async (req, res) => {
    const dados = cicloEdicao.parse(req.body ?? {});
    const cycle = await Cycle.findByIdAndUpdate(objectId.parse(req.params.id), soDefinidos(dados), ATUALIZAR);
    if (!cycle) throw naoEncontrado('Ciclo não encontrado');
    res.json(cycle);
  })
);

router.delete(
  '/:id',
  assincrono(async (req, res) => {
    const cycle = await Cycle.findByIdAndDelete(objectId.parse(req.params.id));
    if (!cycle) throw naoEncontrado('Ciclo não encontrado');
    await Film.deleteMany({ cycleId: cycle._id });
    await Article.deleteMany({ parentId: cycle._id, parentType: 'ciclo' });
    res.json({ ok: true });
  })
);

export default router;
