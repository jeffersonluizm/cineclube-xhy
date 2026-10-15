import { Router } from 'express';
import type { Types } from 'mongoose';
import Magazine from '../models/Magazine';
import Catalog from '../models/Catalog';
import Article from '../models/Article';
import { assincrono } from '../middleware/erros';
import { textosPublicados } from '../lib/conteudo';

const router = Router();

type Resumo = { _id: Types.ObjectId; title: string; slug: string; author: string; column: string; parentId?: Types.ObjectId };

const semPai = ({ parentId: _pai, ...resto }: Resumo) => resto;

/** Edições na prateleira da página inicial (as mais recentes) */
export const EDICOES_NA_HOME = 12;
/** A home não mostra o editorial (até 20 mil caracteres por edição): fica fora da resposta */
const CAMPOS_REVISTA = '-editorial';

/**
 * Página inicial: a publicação mais recente em destaque e as últimas edições da revista.
 * Número fixo de consultas, qualquer que seja o número de edições (antes: uma por edição).
 */
router.get(
  '/',
  assincrono(async (_req, res) => {
    const [magazines, latestMagazine, latestCatalog] = await Promise.all([
      Magazine.find().sort({ number: -1 }).limit(EDICOES_NA_HOME).select(CAMPOS_REVISTA).lean(),
      // A criada por último pode não estar entre as de número maior (edição antiga cadastrada agora)
      Magazine.findOne().sort({ createdAt: -1 }).select(CAMPOS_REVISTA).lean(),
      Catalog.findOne().sort({ createdAt: -1 }).lean(),
    ]);

    // Resumos dos textos publicados dessas edições numa consulta só, agrupados aqui
    const ids = [...magazines.map((m) => m._id), ...(latestMagazine ? [latestMagazine._id] : [])];
    const resumos = ids.length
      ? await Article.find({ parentType: 'revista', parentId: { $in: ids }, published: { $ne: false } })
          .sort({ order: 1 })
          .select('title slug author column parentId')
          .lean<Resumo[]>()
      : [];
    const porRevista = new Map<string, Resumo[]>();
    for (const r of resumos) {
      const chave = String(r.parentId);
      if (!porRevista.has(chave)) porRevista.set(chave, []);
      porRevista.get(chave)!.push(r);
    }
    const textosDa = (id: Types.ObjectId, limite: number) => (porRevista.get(String(id)) ?? []).slice(0, limite).map(semPai);

    let latest: { type: string; data: unknown; articles?: unknown[] } | null = null;
    const magDate = latestMagazine?.createdAt ?? new Date(0);
    const catDate = latestCatalog?.createdAt ?? new Date(0);
    if (latestMagazine && magDate >= catDate) {
      latest = { type: 'revista', data: latestMagazine, articles: textosDa(latestMagazine._id, 5) };
    } else if (latestCatalog) {
      const articles = await Article.find(textosPublicados('catalogo', latestCatalog._id))
        .sort({ order: 1 })
        .limit(5)
        .select('title slug author column')
        .lean();
      latest = { type: 'catalogo', data: latestCatalog, articles };
    }

    // Últimas edições da revista (mais recente primeiro) para navegar rolando a página inicial
    const editions = magazines.map((magazine) => ({ magazine, articles: textosDa(magazine._id, 6) }));

    res.json({ latest, editions });
  })
);

export default router;
