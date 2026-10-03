import { Router, Response } from 'express';
import Magazine from '../models/Magazine';
import Article from '../models/Article';
import Catalog from '../models/Catalog';
import Cycle from '../models/Cycle';
import Film from '../models/Film';
import About from '../models/About';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { slugify } from '../lib/slugify';

async function uniqueSlug(model: { exists: (q: object) => Promise<unknown> }, base: string): Promise<string> {
  let slug = slugify(base);
  let suffix = 1;
  while (await model.exists({ slug })) {
    slug = `${slugify(base)}-${++suffix}`;
  }
  return slug;
}

const router = Router();

// Todas as rotas administrativas exigem autenticação
router.use(requireAuth);

// ---------- Revistas ----------

router.get('/revistas', async (_req: AuthRequest, res: Response) => {
  try {
    const magazines = await Magazine.find().sort({ number: -1 });
    res.json(magazines);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar revistas' });
  }
});

router.post('/revistas', async (req: AuthRequest, res: Response) => {
  try {
    const { number, volume, month, year, coverImage, editorial } = req.body;
    if (number == null || volume == null || !month || year == null) {
      return res.status(400).json({ error: 'Preencha número, volume, mês e ano' });
    }
    const magazine = await Magazine.create({
      number,
      volume,
      month,
      year,
      coverImage,
      editorial,
      slug: slugify(`revista-${number}`),
    });
    res.status(201).json(magazine);
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 11000) {
      return res.status(409).json({ error: 'Já existe uma revista com esse número' });
    }
    res.status(500).json({ error: 'Erro ao criar revista' });
  }
});

router.put('/revistas/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { number, volume, month, year, coverImage, editorial } = req.body;
    const update: Record<string, unknown> = { number, volume, month, year, coverImage, editorial };
    if (number != null) update.slug = slugify(`revista-${number}`);
    Object.keys(update).forEach((k) => update[k] === undefined && delete update[k]);

    const magazine = await Magazine.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!magazine) return res.status(404).json({ error: 'Revista não encontrada' });
    res.json(magazine);
  } catch {
    res.status(500).json({ error: 'Erro ao atualizar revista' });
  }
});

router.delete('/revistas/:id', async (req: AuthRequest, res: Response) => {
  try {
    const magazine = await Magazine.findByIdAndDelete(req.params.id);
    if (!magazine) return res.status(404).json({ error: 'Revista não encontrada' });
    await Article.deleteMany({ parentId: magazine._id, parentType: 'revista' });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Erro ao excluir revista' });
  }
});

// ---------- Artigos ----------

router.get('/artigos', async (req: AuthRequest, res: Response) => {
  try {
    const filter: Record<string, unknown> = {};
    if (req.query.parentId) filter.parentId = req.query.parentId;
    if (req.query.parentType) filter.parentType = req.query.parentType;
    const articles = await Article.find(filter)
      .sort({ order: 1, createdAt: -1 })
      .select('title slug author column order published parentType parentId updatedAt');
    res.json(articles);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar artigos' });
  }
});

// Reordenação precisa vir antes de /artigos/:id
router.put('/artigos/reorder', async (req: AuthRequest, res: Response) => {
  try {
    const { ids } = req.body as { ids?: string[] };
    if (!Array.isArray(ids)) return res.status(400).json({ error: 'Envie a lista de ids' });
    await Promise.all(ids.map((id, i) => Article.findByIdAndUpdate(id, { order: i })));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Erro ao reordenar artigos' });
  }
});

router.get('/artigos/:id', async (req: AuthRequest, res: Response) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ error: 'Artigo não encontrado' });
    res.json(article);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar artigo' });
  }
});

router.post('/artigos', async (req: AuthRequest, res: Response) => {
  try {
    const { title, author, column, epigraph, blocks, footnotes, coverImage, published, parentType, parentId } = req.body;
    if (!title || !author || !column || !parentType || !parentId) {
      return res.status(400).json({ error: 'Preencha título, autor, coluna e a revista de destino' });
    }

    const slug = await uniqueSlug(Article, title);

    const last = await Article.findOne({ parentId, parentType }).sort({ order: -1 });

    const article = await Article.create({
      title,
      slug,
      author,
      column,
      epigraph,
      blocks: blocks || [],
      content: blocksToPlainText(blocks),
      footnotes: footnotes || [],
      coverImage,
      published: published !== false,
      parentType,
      parentId,
      order: last ? last.order + 1 : 0,
    });
    res.status(201).json(article);
  } catch {
    res.status(500).json({ error: 'Erro ao criar artigo' });
  }
});

router.put('/artigos/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { title, author, column, epigraph, blocks, footnotes, coverImage, published, order } = req.body;
    const update: Record<string, unknown> = { title, author, column, epigraph, blocks, footnotes, coverImage, published, order };
    Object.keys(update).forEach((k) => update[k] === undefined && delete update[k]);
    if (blocks) update.content = blocksToPlainText(blocks);

    const article = await Article.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!article) return res.status(404).json({ error: 'Artigo não encontrado' });
    res.json(article);
  } catch {
    res.status(500).json({ error: 'Erro ao atualizar artigo' });
  }
});

router.delete('/artigos/:id', async (req: AuthRequest, res: Response) => {
  try {
    const article = await Article.findByIdAndDelete(req.params.id);
    if (!article) return res.status(404).json({ error: 'Artigo não encontrado' });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Erro ao excluir artigo' });
  }
});

// ---------- Catálogos ----------

router.get('/catalogos', async (_req: AuthRequest, res: Response) => {
  try {
    const catalogs = await Catalog.find().sort({ year: -1, createdAt: -1 });
    res.json(catalogs);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar catálogos' });
  }
});

router.post('/catalogos', async (req: AuthRequest, res: Response) => {
  try {
    const { title, year, coverImage, description } = req.body;
    if (!title || year == null) {
      return res.status(400).json({ error: 'Preencha título e ano' });
    }
    const catalog = await Catalog.create({
      title,
      year,
      coverImage,
      description,
      slug: await uniqueSlug(Catalog, title),
    });
    res.status(201).json(catalog);
  } catch {
    res.status(500).json({ error: 'Erro ao criar catálogo' });
  }
});

router.put('/catalogos/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { title, year, coverImage, description } = req.body;
    const update: Record<string, unknown> = { title, year, coverImage, description };
    Object.keys(update).forEach((k) => update[k] === undefined && delete update[k]);

    const catalog = await Catalog.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!catalog) return res.status(404).json({ error: 'Catálogo não encontrado' });
    res.json(catalog);
  } catch {
    res.status(500).json({ error: 'Erro ao atualizar catálogo' });
  }
});

router.delete('/catalogos/:id', async (req: AuthRequest, res: Response) => {
  try {
    const catalog = await Catalog.findByIdAndDelete(req.params.id);
    if (!catalog) return res.status(404).json({ error: 'Catálogo não encontrado' });
    await Article.deleteMany({ parentId: catalog._id, parentType: 'catalogo' });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Erro ao excluir catálogo' });
  }
});

// ---------- Ciclos & Mostras ----------

router.get('/ciclos', async (_req: AuthRequest, res: Response) => {
  try {
    const cycles = await Cycle.find().sort({ year: -1, createdAt: -1 });
    res.json(cycles);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar ciclos' });
  }
});

router.post('/ciclos', async (req: AuthRequest, res: Response) => {
  try {
    const { title, subtitle, year, coverImage, description, author, authorFootnote, epigraph, footnotes, screenings } = req.body;
    if (!title || year == null) {
      return res.status(400).json({ error: 'Preencha título e ano' });
    }
    const cycle = await Cycle.create({
      title,
      subtitle,
      year,
      coverImage,
      description,
      author,
      authorFootnote,
      epigraph,
      footnotes: footnotes || [],
      screenings: screenings || [],
      slug: await uniqueSlug(Cycle, title),
    });
    res.status(201).json(cycle);
  } catch {
    res.status(500).json({ error: 'Erro ao criar ciclo' });
  }
});

router.put('/ciclos/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { title, subtitle, year, coverImage, description, author, authorFootnote, epigraph, footnotes, screenings } = req.body;
    const update: Record<string, unknown> = { title, subtitle, year, coverImage, description, author, authorFootnote, epigraph, footnotes, screenings };
    Object.keys(update).forEach((k) => update[k] === undefined && delete update[k]);

    const cycle = await Cycle.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!cycle) return res.status(404).json({ error: 'Ciclo não encontrado' });
    res.json(cycle);
  } catch {
    res.status(500).json({ error: 'Erro ao atualizar ciclo' });
  }
});

router.delete('/ciclos/:id', async (req: AuthRequest, res: Response) => {
  try {
    const cycle = await Cycle.findByIdAndDelete(req.params.id);
    if (!cycle) return res.status(404).json({ error: 'Ciclo não encontrado' });
    await Film.deleteMany({ cycleId: cycle._id });
    await Article.deleteMany({ parentId: cycle._id, parentType: 'ciclo' });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Erro ao excluir ciclo' });
  }
});

// ---------- Filmes ----------

router.get('/filmes', async (req: AuthRequest, res: Response) => {
  try {
    const filter: Record<string, unknown> = {};
    if (req.query.cycleId) filter.cycleId = req.query.cycleId;
    const films = await Film.find(filter).sort({ order: 1, createdAt: -1 });
    res.json(films);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar filmes' });
  }
});

router.put('/filmes/reorder', async (req: AuthRequest, res: Response) => {
  try {
    const { ids } = req.body as { ids?: string[] };
    if (!Array.isArray(ids)) return res.status(400).json({ error: 'Envie a lista de ids' });
    await Promise.all(ids.map((id, i) => Film.findByIdAndUpdate(id, { order: i })));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Erro ao reordenar filmes' });
  }
});

router.get('/filmes/:id', async (req: AuthRequest, res: Response) => {
  try {
    const film = await Film.findById(req.params.id);
    if (!film) return res.status(404).json({ error: 'Filme não encontrado' });
    res.json(film);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar filme' });
  }
});

router.post('/filmes', async (req: AuthRequest, res: Response) => {
  try {
    const { title, director, year, duration, country, image, synopsis, content, author, authorFootnote, epigraph, footnotes, cycleId } = req.body;
    if (!title || !director || year == null || !duration || !country || !synopsis || !cycleId) {
      return res.status(400).json({ error: 'Preencha título, direção, ano, duração, país, sinopse e o ciclo' });
    }

    const last = await Film.findOne({ cycleId }).sort({ order: -1 });

    const film = await Film.create({
      title,
      director,
      year,
      duration,
      country,
      image,
      synopsis,
      content,
      author,
      authorFootnote,
      epigraph,
      footnotes: footnotes || [],
      cycleId,
      slug: await uniqueSlug(Film, title),
      order: last ? last.order + 1 : 0,
    });
    res.status(201).json(film);
  } catch {
    res.status(500).json({ error: 'Erro ao criar filme' });
  }
});

router.put('/filmes/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { title, director, year, duration, country, image, synopsis, content, author, authorFootnote, epigraph, footnotes } = req.body;
    const update: Record<string, unknown> = { title, director, year, duration, country, image, synopsis, content, author, authorFootnote, epigraph, footnotes };
    Object.keys(update).forEach((k) => update[k] === undefined && delete update[k]);

    const film = await Film.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!film) return res.status(404).json({ error: 'Filme não encontrado' });
    res.json(film);
  } catch {
    res.status(500).json({ error: 'Erro ao atualizar filme' });
  }
});

router.delete('/filmes/:id', async (req: AuthRequest, res: Response) => {
  try {
    const film = await Film.findByIdAndDelete(req.params.id);
    if (!film) return res.status(404).json({ error: 'Filme não encontrado' });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Erro ao excluir filme' });
  }
});

// ---------- Sobre ----------

router.get('/sobre', async (_req: AuthRequest, res: Response) => {
  try {
    const about = await About.findOne();
    res.json(about || { content: '', blocks: [], team: [] });
  } catch {
    res.status(500).json({ error: 'Erro ao buscar dados' });
  }
});

router.put('/sobre', async (req: AuthRequest, res: Response) => {
  try {
    const { blocks, team } = req.body;
    if (!Array.isArray(blocks) || blocks.length === 0) {
      return res.status(400).json({ error: 'Monte o texto de apresentação em ao menos um bloco' });
    }
    const update = { blocks, content: blocksToPlainText(blocks), team: team || [] };

    const about = await About.findOneAndUpdate({}, update, { new: true, upsert: true });
    res.json(about);
  } catch {
    res.status(500).json({ error: 'Erro ao atualizar dados' });
  }
});

// Mantém o campo content preenchido para compatibilidade com buscas e trechos
function blocksToPlainText(blocks?: { type: string; text?: string }[]): string {
  if (!Array.isArray(blocks)) return '';
  return blocks
    .filter((b) => b.type !== 'image' && b.text)
    .map((b) => b.text)
    .join('\n');
}

export default router;
