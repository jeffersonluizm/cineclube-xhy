import { Router } from 'express';
import { z } from 'zod';
import Magazine from '../models/Magazine';
import Catalog from '../models/Catalog';
import Cycle from '../models/Cycle';
import Film from '../models/Film';
import Article from '../models/Article';
import { assincrono, naoEncontrado } from '../middleware/erros';
import { trecho } from '../lib/conteudo';
import { slugify } from '../lib/slugify';
import { comEnderecos, filmesComEnderecos } from '../lib/enderecos';

/** Rotas de descoberta do site: busca, autores, recentes (RSS) e mapa (sitemap) */
const router = Router();

const PUBLICADO = { published: { $ne: false } } as const;
const CAMPOS_TEXTO = 'title slug author column parentType parentId content createdAt updatedAt';

type TextoLean = {
  _id: unknown;
  title: string;
  slug: string;
  author: string;
  column: string;
  parentType: 'revista' | 'catalogo' | 'ciclo';
  parentId: string;
  content?: string;
  createdAt: Date;
  updatedAt: Date;
};

/** Saída pública de um texto: sem o corpo inteiro, com trecho e endereço */
const resumoTexto = ({ content, ...t }: TextoLean & { href: string }) => ({ ...t, trecho: trecho(content) });

const termo = z.object({
  q: z
    .string({ error: 'Digite o que procura' })
    .trim()
    .min(2, { error: 'Digite ao menos 2 letras' })
    .max(100, { error: 'Busca muito longa (máximo de 100 caracteres)' }),
});

router.get(
  '/busca',
  assincrono(async (req, res) => {
    const { q } = termo.parse(req.query);
    const filtroTexto = { $text: { $search: q } };
    const relevancia = { score: { $meta: 'textScore' } } as const;
    const [textos, filmes] = await Promise.all([
      Article.find({ ...filtroTexto, ...PUBLICADO }, relevancia)
        .sort(relevancia)
        .limit(30)
        .select(CAMPOS_TEXTO)
        .lean<TextoLean[]>(),
      Film.find(filtroTexto, relevancia).sort(relevancia).limit(15).select('title slug director year cycleId').lean(),
    ]);
    res.json({
      termo: q,
      textos: (await comEnderecos(textos)).map(resumoTexto),
      filmes: await filmesComEnderecos(filmes),
    });
  })
);

/** Nomes de autores com textos publicados, com o slug usado na URL */
async function autores() {
  const grupos = await Article.aggregate<{ _id: string; textos: number; atualizado: Date }>([
    { $match: PUBLICADO },
    { $group: { _id: '$author', textos: { $sum: 1 }, atualizado: { $max: '$updatedAt' } } },
  ]);
  // Mesma regra da página do autor: grafias com o mesmo slug ("Lúcia Prado", "lúcia prado") viram uma entrada,
  // com o nome mais usado e a soma dos textos
  const porSlug = new Map<string, { nome: string; slug: string; textos: number; atualizado: Date; maior: number }>();
  for (const g of grupos) {
    const slug = slugify(g._id ?? '');
    if (!slug) continue;
    const atual = porSlug.get(slug);
    if (!atual) {
      porSlug.set(slug, { nome: g._id, slug, textos: g.textos, atualizado: g.atualizado, maior: g.textos });
      continue;
    }
    atual.textos += g.textos;
    if (g.atualizado > atual.atualizado) atual.atualizado = g.atualizado;
    if (g.textos > atual.maior) {
      atual.nome = g._id;
      atual.maior = g.textos;
    }
  }
  return [...porSlug.values()]
    .map(({ nome, slug, textos, atualizado }) => ({ nome, slug, textos, atualizado }))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

router.get(
  '/autores',
  assincrono(async (_req, res) => {
    res.json((await autores()).map(({ nome, slug, textos }) => ({ nome, slug, textos })));
  })
);

router.get(
  '/autores/:slug',
  assincrono(async (req, res) => {
    // A grafia do nome pode variar (acento, caixa): o slug junta as variantes
    const nomes = (await autores()).filter((a) => a.slug === req.params.slug).map((a) => a.nome);
    if (nomes.length === 0) throw naoEncontrado('Autor não encontrado');
    const textos = await Article.find({ author: { $in: nomes }, ...PUBLICADO })
      .sort({ createdAt: -1 })
      .select(CAMPOS_TEXTO)
      .lean<TextoLean[]>();
    res.json({ nome: nomes[0], slug: req.params.slug, textos: (await comEnderecos(textos)).map(resumoTexto) });
  })
);

router.get(
  '/recentes',
  assincrono(async (_req, res) => {
    const textos = await Article.find(PUBLICADO).sort({ createdAt: -1 }).limit(30).select(CAMPOS_TEXTO).lean<TextoLean[]>();
    res.json((await comEnderecos(textos)).map(resumoTexto));
  })
);

router.get(
  '/mapa',
  assincrono(async (_req, res) => {
    const [revistas, catalogos, ciclos, textos, filmes, listaAutores] = await Promise.all([
      Magazine.find().select('number updatedAt').lean(),
      Catalog.find().select('slug updatedAt').lean(),
      Cycle.find().select('slug updatedAt').lean(),
      Article.find(PUBLICADO).select('slug parentType parentId updatedAt').lean<TextoLean[]>(),
      Film.find().select('slug cycleId updatedAt').lean(),
      autores(),
    ]);
    const pagina = (href: string, atualizado: Date) => ({ href, atualizado });
    res.json([
      ...revistas.map((r) => pagina(`/revista/${r.number}`, r.updatedAt)),
      ...catalogos.map((c) => pagina(`/catalogos/${c.slug}`, c.updatedAt)),
      ...ciclos.map((c) => pagina(`/ciclos-mostras/${c.slug}`, c.updatedAt)),
      ...(await comEnderecos(textos)).map((t) => pagina(t.href, t.updatedAt)),
      ...(await filmesComEnderecos(filmes)).map((f) => pagina(f.href, f.updatedAt)),
      ...listaAutores.map((a) => pagina(`/autores/${a.slug}`, a.atualizado)),
    ]);
  })
);

export default router;
