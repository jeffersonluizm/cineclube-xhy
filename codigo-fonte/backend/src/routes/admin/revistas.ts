import { Router } from 'express';
import Magazine from '../../models/Magazine';
import Article from '../../models/Article';
import { assincrono, ErroHttp, naoEncontrado } from '../../middleware/erros';
import { slugify } from '../../lib/slugify';
import { soDefinidos } from '../../lib/conteudo';
import { objectId, revistaEdicao, revistaNova } from '../../validacao/esquemas';
import { ATUALIZAR, duplicado, rotaBuscarPorId } from './comum';

const router = Router();
const JA_EXISTE = 'Já existe uma revista com esse número';

router.get(
  '/',
  assincrono(async (_req, res) => {
    res.json(await Magazine.find().sort({ number: -1 }));
  })
);

rotaBuscarPorId(router, Magazine, 'Revista não encontrada');

/** O que a exclusão leva junto, para o diálogo de confirmação */
router.get(
  '/:id/impacto',
  assincrono(async (req, res) => {
    const id = objectId.parse(req.params.id);
    res.json({ textos: await Article.countDocuments({ parentId: id, parentType: 'revista' }) });
  })
);

router.post(
  '/',
  assincrono(async (req, res) => {
    const dados = revistaNova.parse(req.body ?? {});
    try {
      const magazine = await Magazine.create({ ...dados, slug: slugify(`revista-${dados.number}`) });
      res.status(201).json(magazine);
    } catch (err) {
      if (duplicado(err)) throw new ErroHttp(409, JA_EXISTE);
      throw err;
    }
  })
);

router.put(
  '/:id',
  assincrono(async (req, res) => {
    const dados = revistaEdicao.parse(req.body ?? {});
    const update: Record<string, unknown> = soDefinidos(dados);
    if (dados.number != null) update.slug = slugify(`revista-${dados.number}`);
    try {
      const magazine = await Magazine.findByIdAndUpdate(objectId.parse(req.params.id), update, ATUALIZAR);
      if (!magazine) throw naoEncontrado('Revista não encontrada');
      res.json(magazine);
    } catch (err) {
      if (duplicado(err)) throw new ErroHttp(409, JA_EXISTE);
      throw err;
    }
  })
);

router.delete(
  '/:id',
  assincrono(async (req, res) => {
    const magazine = await Magazine.findByIdAndDelete(objectId.parse(req.params.id));
    if (!magazine) throw naoEncontrado('Revista não encontrada');
    await Article.deleteMany({ parentId: magazine._id, parentType: 'revista' });
    res.json({ ok: true });
  })
);

export default router;
