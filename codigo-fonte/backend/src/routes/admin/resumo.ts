import { Router } from 'express';
import Magazine from '../../models/Magazine';
import Catalog from '../../models/Catalog';
import Cycle from '../../models/Cycle';
import Film from '../../models/Film';
import Article from '../../models/Article';
import { assincrono } from '../../middleware/erros';

const router = Router();

type TextoResumo = { _id: unknown; title: string; parentType: string; parentId: unknown; published?: boolean; updatedAt: Date };

/** Painel inicial do editor: contagens, rascunhos pendentes e o que mudou por último */
router.get(
  '/',
  assincrono(async (_req, res) => {
    const campos = 'title parentType parentId published updatedAt';
    const [revistas, catalogos, ciclos, filmes, textosPublicados, rascunhos, listaRascunhos, ultimos] = await Promise.all([
      Magazine.countDocuments(),
      Catalog.countDocuments(),
      Cycle.countDocuments(),
      Film.countDocuments(),
      Article.countDocuments({ published: { $ne: false } }),
      Article.countDocuments({ published: false }),
      Article.find({ published: false }).sort({ updatedAt: -1 }).limit(10).select(campos).lean<TextoResumo[]>(),
      Article.find().sort({ updatedAt: -1 }).limit(8).select(campos).lean<TextoResumo[]>(),
    ]);

    // Nome legível do lugar de cada texto ("revista n°3", "catálogo Salomé"), numa consulta por tipo
    const ids = (tipo: string) => [...listaRascunhos, ...ultimos].filter((t) => t.parentType === tipo).map((t) => t.parentId);
    const [revs, cats, cics] = await Promise.all([
      Magazine.find({ _id: { $in: ids('revista') } })
        .select('number')
        .lean(),
      Catalog.find({ _id: { $in: ids('catalogo') } })
        .select('title')
        .lean(),
      Cycle.find({ _id: { $in: ids('ciclo') } })
        .select('title')
        .lean(),
    ]);
    const nomes = new Map<string, string>([
      ...revs.map((r) => [String(r._id), `revista n°${r.number}`] as [string, string]),
      ...cats.map((c) => [String(c._id), `catálogo ${c.title}`] as [string, string]),
      ...cics.map((c) => [String(c._id), `ciclo ${c.title}`] as [string, string]),
    ]);
    const comLugar = (t: TextoResumo) => ({ ...t, onde: nomes.get(String(t.parentId)) ?? 'sem destino' });

    res.json({
      contagens: { revistas, catalogos, ciclos, filmes, textosPublicados, rascunhos },
      rascunhos: listaRascunhos.map(comLugar),
      ultimosEditados: ultimos.map(comLugar),
    });
  })
);

export default router;
