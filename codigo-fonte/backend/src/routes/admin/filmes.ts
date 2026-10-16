import { Router } from 'express';
import Film from '../../models/Film';
import { assincrono, naoEncontrado } from '../../middleware/erros';
import { criarComSlugUnico } from '../../lib/slugUnico';
import { soDefinidos } from '../../lib/conteudo';
import { filmeEdicao, filmeNovo, filtroFilmes, objectId } from '../../validacao/esquemas';
import { ATUALIZAR, proximaOrdem, rotaBuscarPorId, rotaReordenar } from './comum';

const router = Router();

router.get(
  '/',
  assincrono(async (req, res) => {
    const filtro = soDefinidos(filtroFilmes.parse(req.query));
    res.json(await Film.find(filtro).sort({ order: 1, createdAt: -1 }));
  })
);

rotaReordenar(router, Film);
rotaBuscarPorId(router, Film, 'Filme não encontrado');

router.post(
  '/',
  assincrono(async (req, res) => {
    const dados = filmeNovo.parse(req.body ?? {});
    const film = await criarComSlugUnico(Film, dados.title, {
      ...dados,
      footnotes: dados.footnotes ?? [],
      order: await proximaOrdem(Film, { cycleId: dados.cycleId }),
    });
    res.status(201).json(film);
  })
);

router.put(
  '/:id',
  assincrono(async (req, res) => {
    const dados = filmeEdicao.parse(req.body ?? {});
    const film = await Film.findByIdAndUpdate(objectId.parse(req.params.id), soDefinidos(dados), ATUALIZAR);
    if (!film) throw naoEncontrado('Filme não encontrado');
    res.json(film);
  })
);

router.delete(
  '/:id',
  assincrono(async (req, res) => {
    const film = await Film.findByIdAndDelete(objectId.parse(req.params.id));
    if (!film) throw naoEncontrado('Filme não encontrado');
    res.json({ ok: true });
  })
);

export default router;
