import { Router } from 'express';
import Article from '../../models/Article';
import { assincrono, ErroHttp, naoEncontrado } from '../../middleware/erros';
import { slugUnico } from '../../lib/slugUnico';
import { soDefinidos, textoCorrido } from '../../lib/conteudo';
import { proximaOrdem, rotaReordenar } from './comum';

const router = Router();

router.get(
  '/',
  assincrono(async (req, res) => {
    const filter: Record<string, unknown> = {};
    if (req.query.parentId) filter.parentId = req.query.parentId;
    if (req.query.parentType) filter.parentType = req.query.parentType;
    const articles = await Article.find(filter)
      .sort({ order: 1, createdAt: -1 })
      .select('title slug author column order published parentType parentId updatedAt');
    res.json(articles);
  })
);

// Reordenação precisa vir antes de /:id
rotaReordenar(router, Article);

router.get(
  '/:id',
  assincrono(async (req, res) => {
    const article = await Article.findById(req.params.id);
    if (!article) throw naoEncontrado('Artigo não encontrado');
    res.json(article);
  })
);

router.post(
  '/',
  assincrono(async (req, res) => {
    const { title, author, column, epigraph, blocks, footnotes, coverImage, published, parentType, parentId } = req.body;
    if (!title || !author || !column || !parentType || !parentId) {
      throw new ErroHttp(400, 'Preencha título, autor, coluna e a revista de destino');
    }
    const article = await Article.create({
      title,
      slug: await slugUnico(Article, title),
      author,
      column,
      epigraph,
      blocks: blocks || [],
      content: textoCorrido(blocks),
      footnotes: footnotes || [],
      coverImage,
      published: published !== false,
      parentType,
      parentId,
      order: await proximaOrdem(Article, { parentId, parentType }),
    });
    res.status(201).json(article);
  })
);

router.put(
  '/:id',
  assincrono(async (req, res) => {
    const { title, author, column, epigraph, blocks, footnotes, coverImage, published, order } = req.body;
    const update: Record<string, unknown> = soDefinidos({ title, author, column, epigraph, blocks, footnotes, coverImage, published, order });
    if (blocks) update.content = textoCorrido(blocks);
    const article = await Article.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!article) throw naoEncontrado('Artigo não encontrado');
    res.json(article);
  })
);

router.delete(
  '/:id',
  assincrono(async (req, res) => {
    const article = await Article.findByIdAndDelete(req.params.id);
    if (!article) throw naoEncontrado('Artigo não encontrado');
    res.json({ ok: true });
  })
);

export default router;
