import { Router } from 'express';
import Magazine from '../models/Magazine';
import Catalog from '../models/Catalog';
import Article from '../models/Article';
import { assincrono } from '../middleware/erros';
import { textosPublicados } from '../lib/conteudo';

const router = Router();

router.get(
  '/',
  assincrono(async (_req, res) => {
    const latestMagazine = await Magazine.findOne().sort({ createdAt: -1 });
    const latestCatalog = await Catalog.findOne().sort({ createdAt: -1 });

    let latest: { type: string; data: unknown; articles?: unknown[] } | null = null;

    const magDate = latestMagazine?.createdAt ?? new Date(0);
    const catDate = latestCatalog?.createdAt ?? new Date(0);

    if (latestMagazine && magDate >= catDate) {
      const articles = await Article.find(textosPublicados('revista', latestMagazine._id)).sort({ order: 1 }).limit(5);
      latest = { type: 'revista', data: latestMagazine, articles };
    } else if (latestCatalog) {
      const articles = await Article.find(textosPublicados('catalogo', latestCatalog._id)).sort({ order: 1 }).limit(5);
      latest = { type: 'catalogo', data: latestCatalog, articles };
    }

    // Todas as edições da revista (mais recente primeiro) para navegar rolando a página inicial
    const magazines = await Magazine.find().sort({ number: -1 });
    const editions = await Promise.all(
      magazines.map(async (magazine) => ({
        magazine,
        articles: await Article.find(textosPublicados('revista', magazine._id))
          .sort({ order: 1 })
          .limit(6)
          .select('title slug author column'),
      }))
    );

    res.json({ latest, editions });
  })
);

export default router;
