import { Router, Request, Response } from 'express';
import Magazine from '../models/Magazine';
import Catalog from '../models/Catalog';
import Article from '../models/Article';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const latestMagazine = await Magazine.findOne().sort({ createdAt: -1 });
    const latestCatalog = await Catalog.findOne().sort({ createdAt: -1 });

    let latest: { type: string; data: unknown; articles?: unknown[] } | null = null;

    const magDate = latestMagazine?.createdAt ?? new Date(0);
    const catDate = latestCatalog?.createdAt ?? new Date(0);

    if (latestMagazine && magDate >= catDate) {
      const articles = await Article.find({ parentId: latestMagazine._id, parentType: 'revista', published: { $ne: false } }).sort({ order: 1 }).limit(5);
      latest = { type: 'revista', data: latestMagazine, articles };
    } else if (latestCatalog) {
      const articles = await Article.find({ parentId: latestCatalog._id, parentType: 'catalogo', published: { $ne: false } }).sort({ order: 1 }).limit(5);
      latest = { type: 'catalogo', data: latestCatalog, articles };
    }

    // Todas as edições da revista (mais recente primeiro) para navegar rolando a página inicial
    const magazines = await Magazine.find().sort({ number: -1 });
    const editions = await Promise.all(
      magazines.map(async (magazine) => ({
        magazine,
        articles: await Article.find({ parentId: magazine._id, parentType: 'revista', published: { $ne: false } })
          .sort({ order: 1 })
          .limit(6)
          .select('title slug author column'),
      }))
    );

    res.json({ latest, editions });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar dados' });
  }
});

export default router;
