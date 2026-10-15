import { z } from 'zod';
import { imagemSegura, linkSeguro } from '../lib/links';
import { demoLigado } from '../lib/demoFlag';

// Mensagens padrão em português para o que não tem mensagem própria
z.config(z.locales.pt());

/**
 * Esquemas de entrada do painel. Cada rota valida o corpo aqui antes de tocar no banco:
 * tipos, tamanhos, enums, ids e URLs seguras. Os models do Mongoose continuam com
 * required/enum (e as atualizações rodam com runValidators) como segunda barreira.
 */

export const objectId = z.string({ error: 'Informe um id' }).regex(/^[a-f\d]{24}$/i, { error: 'id inválido' });

const texto = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { error: `no máximo ${max} caracteres` });
const obrigatorio = (rotulo: string, max = 300) =>
  z
    .string({ error: `Preencha ${rotulo}` })
    .trim()
    .min(1, { error: `Preencha ${rotulo}` })
    .max(max, { error: `${rotulo}: no máximo ${max} caracteres` });
const inteiro = (rotulo: string, min: number, max: number) =>
  z.coerce
    .number({ error: `Preencha ${rotulo} com um número` })
    .int({ error: `${rotulo} deve ser um número inteiro` })
    .min(min, { error: `${rotulo} deve ser no mínimo ${min}` })
    .max(max, { error: `${rotulo} deve ser no máximo ${max}` });
const ano = inteiro('o ano', 1890, 2100);
const imagem = z
  .string()
  .trim()
  .max(2000)
  .refine((v) => imagemSegura(v), {
    error: () =>
      demoLigado()
        ? 'Na demonstração, a imagem precisa ser enviada pelo painel (endereços externos não são aceitos)'
        : 'Imagem precisa ser um upload do painel ou um endereço https',
  });
const notas = z.array(texto(5000)).max(100);

export const bloco = z.object({
  type: z.enum(['paragraph', 'subtitle', 'quote', 'image'], { error: 'Tipo de bloco desconhecido' }),
  text: texto(20000).optional(),
  src: imagem.optional(),
  caption: texto(500).optional(),
  align: z.enum(['full', 'left', 'right', 'center']).optional(),
  width: z.enum(['small', 'medium', 'large']).optional(),
});
const blocos = z.array(bloco).max(500, { error: 'no máximo 500 blocos por texto' });

export const tipoPai = z.enum(['revista', 'catalogo', 'ciclo'], { error: 'Destino inválido' });

// ---------- revistas ----------
export const revistaNova = z.object({
  number: inteiro('o número', 1, 100000),
  volume: inteiro('o volume', 1, 10000),
  month: obrigatorio('o mês', 40),
  year: ano,
  coverImage: imagem.optional(),
  editorial: texto(20000).optional(),
});
export const revistaEdicao = revistaNova.partial();

// ---------- textos (artigos) ----------
export const artigoNovo = z.object({
  title: obrigatorio('o título'),
  author: obrigatorio('o autor', 200),
  column: obrigatorio('a coluna', 80),
  epigraph: texto(2000).optional(),
  blocks: blocos.optional(),
  footnotes: notas.optional(),
  coverImage: imagem.optional(),
  published: z.boolean().optional(),
  parentType: tipoPai,
  parentId: objectId,
});
export const artigoEdicao = artigoNovo
  .omit({ parentType: true, parentId: true })
  .partial()
  .extend({ order: z.number().int().min(0).optional() });
export const filtroArtigos = z.strictObject({ parentId: objectId.optional(), parentType: tipoPai.optional() });

// ---------- catálogos ----------
export const catalogoNovo = z.object({
  title: obrigatorio('o título'),
  year: ano,
  coverImage: imagem.optional(),
  description: texto(20000).optional(),
});
export const catalogoEdicao = catalogoNovo.partial();

// ---------- ciclos ----------
export const sessao = z.object({
  date: obrigatorio('a data da sessão', 40),
  time: obrigatorio('o horário da sessão', 40),
  filmTitle: obrigatorio('o filme da sessão'),
  filmSlug: texto(120).optional(),
  // vínculo com a página do filme; vazio = sessão sem página
  filmId: z
    .union([objectId, z.literal('')])
    .optional()
    .transform((v) => v || undefined),
  director: texto(200).optional().default(''),
  duration: texto(40).optional().default(''),
  country: texto(120).optional().default(''),
});
export const cicloNovo = z.object({
  title: obrigatorio('o título'),
  subtitle: texto(300).optional(),
  year: ano,
  coverImage: imagem.optional(),
  description: texto(20000).optional(),
  author: texto(200).optional(),
  authorFootnote: texto(2000).optional(),
  epigraph: texto(2000).optional(),
  footnotes: notas.optional(),
  screenings: z.array(sessao).max(300).optional(),
});
export const cicloEdicao = cicloNovo.partial();

// ---------- filmes ----------
export const filmeNovo = z.object({
  title: obrigatorio('o título'),
  director: obrigatorio('a direção', 200),
  year: ano,
  duration: obrigatorio('a duração', 40),
  country: obrigatorio('o país', 120),
  image: imagem.optional(),
  synopsis: obrigatorio('a sinopse', 5000),
  content: texto(50000).optional(),
  author: texto(200).optional(),
  authorFootnote: texto(2000).optional(),
  epigraph: texto(2000).optional(),
  footnotes: notas.optional(),
  cycleId: objectId,
});
export const filmeEdicao = filmeNovo.omit({ cycleId: true }).partial();
export const filtroFilmes = z.strictObject({ cycleId: objectId.optional() });

// ---------- sobre ----------
const link = z.object({
  label: obrigatorio('o nome do link', 80),
  url: z.string().trim().max(2000).refine(linkSeguro, { error: 'Links precisam começar com https:// ou mailto:' }),
});
export const sobre = z.object({
  blocks: blocos.min(1, { error: 'Monte o texto de apresentação em ao menos um bloco' }),
  team: z
    .array(
      z.object({
        name: obrigatorio('o nome do integrante', 200),
        role: obrigatorio('a função do integrante', 120),
        email: z.union([z.email({ error: 'E-mail inválido' }), z.literal('')]).optional(),
        links: z.array(link).max(20).optional(),
      })
    )
    .max(200)
    .optional(),
});

// ---------- comuns ----------
export const reordenacao = z.object({
  ids: z.array(objectId, { error: 'Envie a lista de ids' }).max(2000),
});
