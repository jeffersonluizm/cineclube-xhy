import readline from 'readline';
import type { Model } from 'mongoose';
import dotenv from 'dotenv';
import Magazine from '../models/Magazine';
import Article from '../models/Article';
import Catalog from '../models/Catalog';
import Cycle from '../models/Cycle';
import Film from '../models/Film';
import About from '../models/About';
import { conectarBanco } from '../lib/banco';

/**
 * Popula o banco com dados de exemplo. Usa a mesma conexão da API (lib/banco), então
 * em desenvolvimento grava no banco embutido de backend/data/db.
 *
 * ATENÇÃO: apaga revistas, textos, catálogos, ciclos, filmes e o Sobre antes de inserir.
 * Com dados no banco, só segue com confirmação (s/N) ou com --force.
 *   npm run seed
 *   npm run seed -- --force
 */

// Model<any>: só usamos countDocuments/deleteMany, iguais em todos os modelos
const COLECOES: Model<any>[] = [Magazine, Article, Catalog, Cycle, Film, About];

const LOREM_SHORT = 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl ut aliquip ex ea commodo consequat.';

const LOREM_LONG = `${LOREM_SHORT} Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat, vel illum dolore eu feugiat nulla facilisis at vero eros et accumsan et iusto odio dignissim qui blandit praesent luptatum zzril delenit augue duis dolore te feugait nulla facilisi.
${LOREM_SHORT}
${LOREM_SHORT} Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat, vel illum dolore eu feugiat nulla facilisis at vero eros et accumsan et iusto odio dignissim qui blandit praesent luptatum zzril delenit augue duis dolore te feugait nulla facilisi.
${LOREM_SHORT}`;

export interface OpcoesSeed {
  /** --force: substitui sem perguntar */
  force: boolean;
  /** Pergunta ao usuário; só é chamada se houver dados e não houver --force */
  confirmar: (pergunta: string) => Promise<boolean>;
  log?: (mensagem: string) => void;
}

export function pedeForce(argv: string[]): boolean {
  return argv.includes('--force') || argv.includes('-f');
}

export function respostaConfirma(resposta: string): boolean {
  return ['s', 'sim'].includes(resposta.trim().toLowerCase());
}

/** Pressupõe o mongoose já conectado. Nunca apaga dados sem --force ou confirmação. */
export async function executarSeed({ force, confirmar, log = console.log }: OpcoesSeed): Promise<'aplicado' | 'cancelado'> {
  const contagens = await Promise.all(COLECOES.map((modelo) => modelo.countDocuments()));
  const existentes = contagens.reduce((total, n) => total + n, 0);

  if (existentes > 0 && !force) {
    const ok = await confirmar(
      `O banco já tem ${existentes} documento(s) (revistas, textos, catálogos, ciclos, filmes, sobre). ` +
        'Apagar tudo e inserir os dados de exemplo?'
    );
    if (!ok) {
      log('Seed cancelado: nenhum dado foi apagado. Para substituir sem perguntar, use: npm run seed -- --force');
      return 'cancelado';
    }
  }

  for (const modelo of COLECOES) {
    await modelo.deleteMany({});
  }

  // Revista n°1
  const magazine = await Magazine.create({
    number: 1,
    volume: 1,
    month: 'abril',
    year: 2026,
    slug: 'n1',
    editorial: LOREM_SHORT,
  });

  const article1 = await Article.create({
    title: 'Como filmar os próprios fantasmas?',
    slug: 'como-filmar-os-proprios-fantasmas',
    author: 'Brenda Valois',
    column: 'coluna xxx',
    epigraph: `'${LOREM_SHORT}'`,
    content: LOREM_LONG,
    footnotes: [`'${LOREM_SHORT}`],
    order: 1,
    parentType: 'revista',
    parentId: magazine._id,
  });

  await Article.create({
    title: 'O tempo suspenso no cinema de Tati',
    slug: 'o-tempo-suspenso-no-cinema-de-tati',
    author: 'Davi B.',
    column: 'coluna xxx',
    epigraph: `'${LOREM_SHORT}'`,
    content: LOREM_LONG,
    footnotes: [`'${LOREM_SHORT}`],
    order: 2,
    parentType: 'revista',
    parentId: magazine._id,
  });

  await Article.create({
    title: 'Notas sobre o melodrama contemporâneo',
    slug: 'notas-sobre-o-melodrama-contemporaneo',
    author: 'Brenda Valois',
    column: 'coluna yyy',
    epigraph: `'${LOREM_SHORT}'`,
    content: LOREM_LONG,
    footnotes: [`'${LOREM_SHORT}`],
    order: 3,
    parentType: 'revista',
    parentId: magazine._id,
  });

  // Catálogos
  const cat2026 = await Catalog.create({
    title: 'Júlio Bressane',
    slug: 'julio-bressane',
    year: 2026,
    description: LOREM_SHORT,
  });

  await Article.create({
    title: 'Como filmar os próprios fantasmas?',
    slug: 'cat-como-filmar-os-proprios-fantasmas',
    author: 'Brenda Valois',
    column: 'traduções',
    epigraph: `'${LOREM_SHORT}'`,
    content: LOREM_LONG,
    footnotes: [`'${LOREM_SHORT}`],
    order: 1,
    parentType: 'catalogo',
    parentId: cat2026._id,
  });

  await Article.create({
    title: `${LOREM_SHORT.substring(0, 40)}`,
    slug: 'cat-texto-sobre-bressane',
    author: 'Davi B.',
    column: 'textos',
    epigraph: `'${LOREM_SHORT}'`,
    content: LOREM_LONG,
    order: 2,
    parentType: 'catalogo',
    parentId: cat2026._id,
  });

  await Catalog.create({ title: 'Atrizes, Atrizes', slug: 'atrizes-atrizes', year: 2025 });
  await Catalog.create({ title: 'David Lynch e seus precursores', slug: 'david-lynch-e-seus-precursores', year: 2025 });
  await Catalog.create({ title: 'Salomé', slug: 'salome', year: 2024 });
  await Catalog.create({ title: 'Sirk & Fassbinder', slug: 'sirk-fassbinder', year: 2024 });

  // Ciclos & Mostras
  const cycle2026 = await Cycle.create({
    title: 'O Tempo do Depois',
    subtitle: 'o cinema de Béla Taar e Pedro Costa',
    slug: 'o-tempo-do-depois',
    year: 2026,
    description: `Falar sobre a mostra, motivação, proposta etc.. [escolher uma pessoa para fazer esse texto introdutório]; lista dos filmes programados + sinopse escrita por alguém do cineclube que já viu + um ou dois parágrafos pequenos sobre o filme...\n ${LOREM_SHORT} Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat, vel illum dolore eu feugiat nulla facilisis at vero eros et`,
    author: 'davi b',
    authorFootnote: LOREM_SHORT,
    epigraph: `'${LOREM_SHORT}'`,
    footnotes: [`'${LOREM_SHORT}`],
    screenings: [
      { date: '09.03', time: '14h', filmTitle: 'No Quarto de Vanda (2000)', filmSlug: 'no-quarto-de-vanda', director: 'Pedro Costa', duration: "117'", country: 'Portugal' },
      { date: '09.03', time: '14h', filmTitle: 'No Quarto de Vanda (2000)', filmSlug: 'no-quarto-de-vanda', director: 'Pedro Costa', duration: "117'", country: 'Portugal' },
      { date: '16.03', time: '14h', filmTitle: 'Satantango (1994)', filmSlug: 'satantango', director: 'Béla Tarr', duration: "432'", country: 'Hungria' },
    ],
  });

  await Film.create({
    title: 'No Quarto de Vanda',
    slug: 'no-quarto-de-vanda',
    director: 'Pedro Costa',
    year: 2000,
    duration: "117'",
    country: 'Portugal',
    synopsis: 'Vanda Duarte é uma jovem tóxico-dependente. Isolada do mundo exterior, fechada em seu quarto humilde, vive com mágoa e desencanto, sentimentos que partilha com alguns familiares e amigos.',
    content: `sobre no quarto de vanda, algo breve\n${LOREM_LONG}`,
    author: 'Lucas Regis',
    authorFootnote: LOREM_SHORT,
    epigraph: `'${LOREM_SHORT}'`,
    footnotes: [`'${LOREM_SHORT}`],
    cycleId: cycle2026._id,
    order: 1,
  });

  await Film.create({
    title: 'Satantango',
    slug: 'satantango',
    director: 'Béla Tarr',
    year: 1994,
    duration: "432'",
    country: 'Hungria',
    synopsis: `${LOREM_SHORT}`,
    content: LOREM_LONG,
    author: 'Davi B.',
    cycleId: cycle2026._id,
    order: 2,
  });

  await Article.create({
    title: 'Depois do fim: notas sobre a mostra',
    slug: 'ciclo-depois-do-fim-notas-sobre-a-mostra',
    author: 'Davi B.',
    column: 'textos',
    epigraph: `'${LOREM_SHORT}'`,
    content: LOREM_LONG,
    order: 1,
    parentType: 'ciclo',
    parentId: cycle2026._id,
  });

  await Cycle.create({ title: 'Realizadoras', slug: 'realizadoras', year: 2026 });
  await Cycle.create({ title: 'Cinema Marginal', slug: 'cinema-marginal', year: 2026 });
  await Cycle.create({ title: 'Comédia Moderna', slug: 'comedia-moderna', year: 2025 });
  await Cycle.create({ title: 'A rotina tem seu charme', slug: 'a-rotina-tem-seu-charme', year: 2025 });

  // Sobre (equipe fictícia: o conteúdo real é cadastrado pelo painel)
  await About.create({
    content: `O Cineclube.... ${LOREM_LONG}`,
    team: [
      { name: 'ana exemplo', role: 'coordenação', email: 'ana@exemplo.com' },
      { name: 'bruno modelo', role: 'editorial', email: 'bruno@exemplo.com' },
      { name: 'carla teste', role: 'editorial', email: 'carla@exemplo.com' },
    ],
  });

  log('Seed concluído com sucesso!');
  return 'aplicado';
}

function perguntarNoTerminal(pergunta: string): Promise<boolean> {
  // Sem terminal interativo (CI, pipe) não há como confirmar: recusa
  if (!process.stdin.isTTY) {
    console.log(`${pergunta}
Sem terminal interativo para confirmar.`);
    return Promise.resolve(false);
  }
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(`${pergunta} [s/N] `, (resposta) => {
      rl.close();
      resolve(respostaConfirma(resposta));
    });
  });
}

async function main() {
  dotenv.config();
  const conexao = await conectarBanco();
  try {
    const resultado = await executarSeed({ force: pedeForce(process.argv), confirmar: perguntarNoTerminal });
    if (resultado === 'cancelado') process.exitCode = 1;
  } finally {
    await conexao.desconectar();
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
