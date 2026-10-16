import { Router } from 'express';
import Article from '../../models/Article';
import Magazine from '../../models/Magazine';
import Catalog from '../../models/Catalog';
import Cycle from '../../models/Cycle';
import { assincrono, naoEncontrado } from '../../middleware/erros';
import { criarComSlugUnico } from '../../lib/slugUnico';
import { soDefinidos, textoCorrido } from '../../lib/conteudo';
import { artigoEdicao, artigoNovo, filtroArtigos, objectId } from '../../validacao/esquemas';
import { ATUALIZAR, proximaOrdem, rotaBuscarPorId, rotaReordenar } from './comum';

const router = Router();

/** Destino do texto precisa existir: sem isso, o texto fica órfão e não aparece em lugar nenhum */
const DESTINOS = {
  revista: { modelo: Magazine, nome: 'Revista não encontrada' },
  catalogo: { modelo: Catalog, nome: 'Catálogo não encontrado' },
  ciclo: { modelo: Cycle, nome: 'Exibição não encontrada' },
} as const;

router.get(
  '/',
  assincrono(async (req, res) => {
    // Filtro validado: só ids e tipos como texto, nunca objetos com operadores ($ne, $gt...)
    const filtro = soDefinidos(filtroArtigos.parse(req.query));
    const articles = await Article.find(filtro)
      .sort({ order: 1, createdAt: -1 })
      .select('title slug author column order published parentType parentId updatedAt');
    res.json(articles);
  })
);

// Reordenação precisa vir antes de /:id
rotaReordenar(router, Article);
rotaBuscarPorId(router, Article, 'Artigo não encontrado');

router.post(
  '/',
  assincrono(async (req, res) => {
    const dados = artigoNovo.parse(req.body ?? {});
    const destino = DESTINOS[dados.parentType];
    // Model<any> na união dos três modelos: só usamos exists
    if (!(await (destino.modelo as typeof Magazine).exists({ _id: dados.parentId }))) throw naoEncontrado(destino.nome);
    const article = await criarComSlugUnico(Article, dados.title, {
      ...dados,
      blocks: dados.blocks ?? [],
      content: textoCorrido(dados.blocks),
      footnotes: dados.footnotes ?? [],
      published: dados.published !== false,
      order: await proximaOrdem(Article, { parentId: dados.parentId, parentType: dados.parentType }),
    });
    res.status(201).json(article);
  })
);

router.put(
  '/:id',
  assincrono(async (req, res) => {
    const dados = artigoEdicao.parse(req.body ?? {});
    const update: Record<string, unknown> = soDefinidos(dados);
    if (dados.blocks) update.content = textoCorrido(dados.blocks);
    const article = await Article.findByIdAndUpdate(objectId.parse(req.params.id), update, ATUALIZAR);
    if (!article) throw naoEncontrado('Artigo não encontrado');
    res.json(article);
  })
);

router.delete(
  '/:id',
  assincrono(async (req, res) => {
    const article = await Article.findByIdAndDelete(objectId.parse(req.params.id));
    if (!article) throw naoEncontrado('Artigo não encontrado');
    res.json({ ok: true });
  })
);

export default router;
