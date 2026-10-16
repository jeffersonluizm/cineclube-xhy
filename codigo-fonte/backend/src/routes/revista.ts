import { Router } from 'express';
import Magazine from '../models/Magazine';
import Article from '../models/Article';
import { assincrono, naoEncontrado } from '../middleware/erros';
import { agruparPor, CAMPOS_SUMARIO, paraSumario, textosPublicados, vizinhos } from '../lib/conteudo';

const router = Router();

async function revistaPeloNumero(numero: string) {
  const magazine = await Magazine.findOne({ number: Number(numero) }).lean();
  if (!magazine) throw naoEncontrado('Revista não encontrada');
  return magazine;
}

router.get(
  '/',
  assincrono(async (_req, res) => {
    res.json(await Magazine.find().sort({ number: -1 }).lean());
  })
);

router.get(
  '/:number',
  assincrono(async (req, res) => {
    const magazine = await revistaPeloNumero(req.params.number);
    const articles = await Article.find(textosPublicados('revista', magazine._id))
      .sort({ order: 1 })
      .select(CAMPOS_SUMARIO)
      .lean<{ column: string; content?: string }[]>();
    res.json({ magazine, columns: agruparPor(articles.map(paraSumario), 'column') });
  })
);

router.get(
  '/:number/artigo/:slug',
  assincrono(async (req, res) => {
    const magazine = await revistaPeloNumero(req.params.number);
    const article = await Article.findOne({ slug: req.params.slug, parentId: magazine._id, published: { $ne: false } }).lean();
    if (!article) throw naoEncontrado('Artigo não encontrado');

    const todos = await Article.find(textosPublicados('revista', magazine._id))
      .sort({ order: 1 })
      .select('title slug author')
      .lean<{ title: string; slug: string; author: string }[]>();
    res.json({ article, magazine, ...vizinhos(todos, req.params.slug, ['title', 'slug', 'author']) });
  })
);

export default router;
