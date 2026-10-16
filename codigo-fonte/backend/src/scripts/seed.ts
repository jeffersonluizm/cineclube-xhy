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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const COLECOES: Model<any>[] = [Magazine, Article, Catalog, Cycle, Film, About];

export interface OpcoesSeed {
  /** Descrição do banco conectado (ConexaoBanco.descricao), mostrada na pergunta */
  banco: string;
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
export async function executarSeed({ banco, force, confirmar, log = console.log }: OpcoesSeed): Promise<'aplicado' | 'cancelado'> {
  const contagens = await Promise.all(COLECOES.map((modelo) => modelo.countDocuments()));
  const existentes = contagens.reduce((total, n) => total + n, 0);

  if (existentes > 0 && !force) {
    const ok = await confirmar(
      `O banco ${banco} já tem ${existentes} documento(s) (revistas, textos, catálogos, ciclos, filmes, sobre). ` +
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

  // Conteúdo de exemplo escrito para o projeto (textos e equipe fictícios, sem material de terceiros)
  const p = (text: string) => ({ type: 'paragraph' as const, text });
  const corrido = (blocos: { text?: string }[]) =>
    blocos
      .map((b) => b.text)
      .filter(Boolean)
      .join('\n');

  // Revista n°1
  const magazine = await Magazine.create({
    number: 1,
    volume: 1,
    month: 'abril',
    year: 2026,
    slug: 'n1',
    coverImage: '/demo/capa-revista-1.png',
    editorial:
      'Esta primeira edição nasce das conversas depois das sessões: o que fica de um filme quando a sala acende. ' +
      'Reunimos textos sobre a duração, o fantasma e o melodrama, três maneiras de o cinema lidar com o que não cabe no presente.',
  });

  const fantasmas = [
    p(
      'Há filmes que parecem assombrados não pelo que mostram, mas pelo que deixam fora do quadro. A câmera se detém num corredor vazio e a espera vira personagem.'
    ),
    { type: 'quote' as const, text: 'Filmar um fantasma é filmar o tempo que alguém deixou num lugar.' },
    p(
      'Nas sessões do cineclube, a pergunta que mais voltou foi simples: como a imagem consegue guardar uma ausência? A resposta passa menos pelos efeitos e mais pela paciência do plano.'
    ),
    { type: 'subtitle' as const, text: 'O corredor e a janela' },
    p(
      'Quando a montagem recusa o corte que resolveria a cena, o espectador é convidado a habitar o vazio. O fantasma, então, é o próprio tempo que sobra.'
    ),
  ];
  await Article.create({
    title: 'Como filmar os próprios fantasmas?',
    slug: 'como-filmar-os-proprios-fantasmas',
    author: 'Brenda Valois',
    column: 'ensaio',
    epigraph: 'O que fica de um lugar quando a gente sai dele?',
    blocks: fantasmas,
    content: corrido(fantasmas),
    footnotes: ['Brenda Valois escreve sobre cinema e coordena as sessões de domingo do cineclube.'],
    order: 1,
    parentType: 'revista',
    parentId: magazine._id,
  });

  const tati = [
    p(
      'Em Tati, o gag não explode: ele se espalha pelo quadro e espera ser encontrado. O riso chega atrasado, como quem percebe uma piada só ao sair da sala.'
    ),
    p(
      'A cidade moderna vira um grande mecanismo de portas, vidros e corredores, e o corpo desajeitado do protagonista é o grão de areia que mostra o funcionamento da máquina.'
    ),
    p('Rever esses filmes em grupo muda tudo: cada pessoa ri de um canto diferente da tela.'),
  ];
  await Article.create({
    title: 'O tempo suspenso no cinema de Tati',
    slug: 'o-tempo-suspenso-no-cinema-de-tati',
    author: 'Davi Bastos',
    column: 'crítica',
    epigraph: 'Tudo acontece ao mesmo tempo, mas devagar.',
    blocks: tati,
    content: corrido(tati),
    order: 2,
    parentType: 'revista',
    parentId: magazine._id,
  });

  const melodrama = [
    p(
      'O melodrama nunca saiu de cena; mudou de endereço. Está nas novelas, nos vídeos curtos, nas canções que contam uma vida inteira em três minutos.'
    ),
    p(
      'O que o cinema contemporâneo faz com esse excesso? Às vezes o esconde sob uma superfície fria; às vezes o assume sem vergonha, com cor saturada e música alta.'
    ),
  ];
  await Article.create({
    title: 'Notas sobre o melodrama contemporâneo',
    slug: 'notas-sobre-o-melodrama-contemporaneo',
    author: 'Brenda Valois',
    column: 'crítica',
    blocks: melodrama,
    content: corrido(melodrama),
    order: 3,
    parentType: 'revista',
    parentId: magazine._id,
  });

  // Revista n°2
  const revista2 = await Magazine.create({
    number: 2,
    volume: 1,
    month: 'julho',
    year: 2026,
    slug: 'n2',
    coverImage: '/demo/capa-revista-2.png',
    editorial:
      'A segunda edição sai da tela e olha para a sala: quem vem, quem fica para a conversa, o que se ouve no escuro. ' +
      'Um ensaio sobre o cineclube como lugar público, uma crítica sobre o som e o relato de uma sessão ao ar livre.',
  });

  const sala = [
    p(
      'Uma sala escura com cadeiras enfileiradas parece o contrário de uma praça. Ninguém conversa, todos olham na mesma direção. Ainda assim, é ali que muita gente da vizinhança se encontra toda semana.'
    ),
    { type: 'quote' as const, text: 'O filme termina na tela; a sessão termina na calçada.' },
    p(
      'O cineclube vive desse intervalo entre o fim do filme e a volta para casa. É nele que um desconhecido vira alguém com quem se discorda com gosto.'
    ),
  ];
  await Article.create({
    title: 'A sala escura como praça pública',
    slug: 'a-sala-escura-como-praca-publica',
    author: 'Lucas Régis',
    column: 'ensaio',
    epigraph: 'Ver junto é diferente de ver ao mesmo tempo.',
    blocks: sala,
    content: corrido(sala),
    order: 1,
    parentType: 'revista',
    parentId: revista2._id,
  });

  const som = [
    p(
      'Fechar os olhos no meio de uma sessão é um bom exercício: o filme continua. A chuva, os passos no corredor, uma porta que range explicam a cena quase tanto quanto a imagem.'
    ),
    p(
      'Os filmes que mais nos marcaram neste semestre foram os que confiaram no fora de campo sonoro, deixando o espectador imaginar o que não se vê.'
    ),
  ];
  await Article.create({
    title: 'Ouvir um filme de olhos fechados',
    slug: 'ouvir-um-filme-de-olhos-fechados',
    author: 'Brenda Valois',
    column: 'crítica',
    blocks: som,
    content: corrido(som),
    order: 2,
    parentType: 'revista',
    parentId: revista2._id,
  });

  const arLivre = [
    p(
      'Projetamos numa parede da escola do bairro, com um lençol esticado e caixas de som emprestadas. O vento mexia a imagem e ninguém reclamou.'
    ),
    p('Este relato registra o que deu certo, o que deu errado e o que vamos repetir na próxima sessão ao ar livre.'),
  ];
  await Article.create({
    title: 'Diário de uma sessão ao ar livre',
    slug: 'diario-de-uma-sessao-ao-ar-livre',
    author: 'Davi Bastos',
    column: 'relato',
    blocks: arLivre,
    content: corrido(arLivre),
    order: 3,
    parentType: 'revista',
    parentId: revista2._id,
  });

  // Catálogos
  const cat2026 = await Catalog.create({
    title: 'Júlio Bressane',
    slug: 'julio-bressane',
    coverImage: '/demo/capa-catalogo-bressane.png',
    year: 2026,
    description: 'Catálogo da mostra dedicada ao cineasta, com traduções, ensaios inéditos e a programação comentada.',
  });

  const bressane = [
    p(
      'Em vez de contar uma história, os filmes de Bressane parecem conversar com outros filmes, livros e músicas. Assistir é entrar numa biblioteca que se move.'
    ),
    p(
      'Este texto acompanha a mostra e propõe um roteiro de leitura: começar pelos curtas, voltar aos longas e terminar onde a obra começou.'
    ),
  ];
  await Article.create({
    title: 'Uma biblioteca em movimento',
    slug: 'cat-uma-biblioteca-em-movimento',
    author: 'Davi Bastos',
    column: 'textos',
    blocks: bressane,
    content: corrido(bressane),
    order: 1,
    parentType: 'catalogo',
    parentId: cat2026._id,
  });

  const traducao = [
    p(
      'Apresentamos uma tradução livre de anotações de trabalho, escrita para a equipe do cineclube a partir das sessões de estudo da mostra.'
    ),
  ];
  await Article.create({
    title: 'Notas de trabalho sobre a montagem',
    slug: 'cat-notas-de-trabalho-sobre-a-montagem',
    author: 'Brenda Valois',
    column: 'traduções',
    blocks: traducao,
    content: corrido(traducao),
    order: 2,
    parentType: 'catalogo',
    parentId: cat2026._id,
  });

  const catSirk = await Catalog.create({
    title: 'Sirk & Fassbinder',
    slug: 'sirk-fassbinder',
    year: 2024,
    coverImage: '/demo/capa-catalogo-sirk.png',
    description: 'Catálogo da mostra que pôs lado a lado dois mestres do melodrama, com ensaios da equipe e um glossário de cores.',
  });

  const molduras = [
    p(
      'Espelhos, janelas e portas entreabertas: nos filmes desta mostra, os personagens quase sempre aparecem emoldurados, presos dentro do quadro antes de estarem presos na história.'
    ),
    p('Este ensaio percorre essas molduras e pergunta o que elas dizem sobre o desejo de sair de casa.'),
  ];
  await Article.create({
    title: 'Molduras dentro do quadro',
    slug: 'cat-molduras-dentro-do-quadro',
    author: 'Brenda Valois',
    column: 'textos',
    blocks: molduras,
    content: corrido(molduras),
    order: 1,
    parentType: 'catalogo',
    parentId: catSirk._id,
  });

  const glossario = [
    p(
      'Um glossário curto das cores que mais aparecem na mostra: o vermelho das festas, o azul das noites sozinhas, o amarelo das cozinhas.'
    ),
  ];
  await Article.create({
    title: 'Pequeno glossário de cores',
    slug: 'cat-pequeno-glossario-de-cores',
    author: 'Lucas Régis',
    column: 'glossário',
    blocks: glossario,
    content: corrido(glossario),
    order: 2,
    parentType: 'catalogo',
    parentId: catSirk._id,
  });

  // Ciclos & Mostras
  const cycle2026 = await Cycle.create({
    title: 'O Tempo do Depois',
    subtitle: 'o cinema de Béla Tarr e Pedro Costa',
    slug: 'o-tempo-do-depois',
    coverImage: '/demo/capa-ciclo-tempo.png',
    year: 2026,
    description:
      'Dois cineastas que filmam o que vem depois: depois da fábrica, depois do bairro, depois da promessa de futuro.\n' +
      'A mostra reúne filmes longos e pacientes, que pedem do público o mesmo tempo que os personagens passam esperando. Cada sessão termina com uma conversa aberta.',
    author: 'Davi Bastos',
    authorFootnote: 'Davi Bastos programa as mostras do cineclube desde 2023.',
    epigraph: 'Esperar também é uma forma de olhar.',
    footnotes: ['As sessões longas têm intervalo de quinze minutos.'],
    screenings: [
      {
        date: '09.03',
        time: '14h',
        filmTitle: 'No Quarto da Vanda (2000)',
        filmSlug: 'no-quarto-de-vanda',
        director: 'Pedro Costa',
        duration: "171'",
        country: 'Portugal',
      },
      {
        date: '16.03',
        time: '14h',
        filmTitle: 'Sátántangó (1994)',
        filmSlug: 'satantango',
        director: 'Béla Tarr',
        duration: "432'",
        country: 'Hungria',
      },
      { date: '23.03', time: '19h', filmTitle: 'Conversa de encerramento', director: 'equipe do cineclube', duration: "60'", country: '' },
    ],
  });

  await Film.create({
    title: 'No Quarto da Vanda',
    slug: 'no-quarto-de-vanda',
    director: 'Pedro Costa',
    year: 2000,
    duration: "171'",
    country: 'Portugal',
    synopsis:
      'Num bairro de Lisboa em demolição, Vanda passa os dias no quarto, entre conversas, tosse e o barulho das máquinas que derrubam as casas vizinhas.',
    content:
      'O filme se instala no quarto e quase não sai dele. O tempo é o do bairro, não o da narrativa.\n' +
      'Na sessão, vale reparar na luz que entra pela janela: ela marca as horas melhor do que qualquer relógio.',
    author: 'Lucas Régis',
    authorFootnote: 'Lucas Régis escreve as fichas dos filmes das mostras.',
    epigraph: 'O bairro inteiro cabe num quarto.',
    cycleId: cycle2026._id,
    order: 1,
  });

  await Film.create({
    title: 'Sátántangó',
    slug: 'satantango',
    director: 'Béla Tarr',
    year: 1994,
    duration: "432'",
    country: 'Hungria',
    synopsis:
      'Numa fazenda coletiva em ruínas, moradores à espera de dinheiro ouvem que um antigo vizinho, dado como morto, está voltando.',
    content: 'Sete horas de chuva, lama e dança. A duração não é um desafio de resistência: é a matéria do filme.',
    author: 'Davi Bastos',
    cycleId: cycle2026._id,
    order: 2,
  });

  const depois = [
    p('Organizar esta mostra foi aceitar que o público sairia cansado e, ainda assim, voltaria. Foi o que aconteceu.'),
    p(
      'Estas notas registram o que se discutiu depois das sessões: o lugar do trabalho, a amizade e o tempo que o cinema ainda consegue guardar.'
    ),
  ];
  await Article.create({
    title: 'Depois do fim: notas sobre a mostra',
    slug: 'ciclo-depois-do-fim-notas-sobre-a-mostra',
    author: 'Davi Bastos',
    column: 'textos',
    blocks: depois,
    content: corrido(depois),
    order: 1,
    parentType: 'ciclo',
    parentId: cycle2026._id,
  });

  const comedia = await Cycle.create({
    title: 'Comédia Moderna',
    subtitle: 'o riso diante das máquinas',
    slug: 'comedia-moderna',
    coverImage: '/demo/capa-ciclo-comedia.png',
    year: 2025,
    description:
      'Uma mostra sobre comédias em que a cidade, os aparelhos e os escritórios são personagens.\n' +
      'As sessões foram pensadas para famílias: filmes curtos de duração e longos de gargalhada.',
    author: 'Lucas Régis',
    screenings: [
      {
        date: '05.10',
        time: '16h',
        filmTitle: 'Meu Tio (1958)',
        filmSlug: 'meu-tio',
        director: 'Jacques Tati',
        duration: "117'",
        country: 'França',
      },
      {
        date: '12.10',
        time: '16h',
        filmTitle: 'Tempos Modernos (1936)',
        filmSlug: 'tempos-modernos',
        director: 'Charles Chaplin',
        duration: "87'",
        country: 'Estados Unidos',
      },
    ],
  });

  await Film.create({
    title: 'Meu Tio',
    slug: 'meu-tio',
    director: 'Jacques Tati',
    year: 1958,
    duration: "117'",
    country: 'França',
    synopsis: 'Um tio distraído visita a casa automatizada da irmã, onde cada aparelho parece ter vontade própria.',
    content: 'A casa moderna faz barulhos que ninguém pediu. O riso nasce de reparar nesses barulhos junto com o sobrinho.',
    author: 'Lucas Régis',
    cycleId: comedia._id,
    order: 1,
  });

  await Film.create({
    title: 'Tempos Modernos',
    slug: 'tempos-modernos',
    director: 'Charles Chaplin',
    year: 1936,
    duration: "87'",
    country: 'Estados Unidos',
    synopsis: 'Um operário da linha de montagem tenta sobreviver à fábrica, à crise e à polícia, sem perder a gentileza.',
    content: 'A engrenagem que engole o operário ainda é uma das imagens mais claras sobre o trabalho que o cinema já fez.',
    author: 'Davi Bastos',
    cycleId: comedia._id,
    order: 2,
  });

  const riso = [p('Rir em grupo é contagioso, e as sessões desta mostra provaram isso: as crianças riam primeiro, os adultos depois.')];
  await Article.create({
    title: 'Quem ri primeiro na sala',
    slug: 'ciclo-quem-ri-primeiro-na-sala',
    author: 'Lucas Régis',
    column: 'textos',
    blocks: riso,
    content: corrido(riso),
    order: 1,
    parentType: 'ciclo',
    parentId: comedia._id,
  });

  // Exibição sem capa de propósito: mostra a capa padrão (título e logo sobre o roxo)
  const realizadoras = await Cycle.create({
    title: 'Realizadoras',
    subtitle: 'filmes dirigidos por mulheres',
    slug: 'realizadoras',
    year: 2026,
    description:
      'Uma sessão por mês dedicada a diretoras de várias épocas, seguida de conversa com convidadas.\n' +
      'A programação cresce ao longo do ano: as novas sessões são anunciadas aqui.',
    author: 'Brenda Valois',
    screenings: [
      {
        date: '14.11',
        time: '19h',
        filmTitle: 'Cléo das 5 às 7 (1962)',
        filmSlug: 'cleo-das-5-as-7',
        director: 'Agnès Varda',
        duration: "90'",
        country: 'França',
      },
    ],
  });

  await Film.create({
    title: 'Cléo das 5 às 7',
    slug: 'cleo-das-5-as-7',
    director: 'Agnès Varda',
    year: 1962,
    duration: "90'",
    country: 'França',
    synopsis: 'Uma cantora espera o resultado de um exame médico e atravessa Paris em quase tempo real.',
    content: 'O relógio da tela e o da sala andam juntos: a espera da personagem vira a espera de quem assiste.',
    author: 'Brenda Valois',
    cycleId: realizadoras._id,
    order: 1,
  });

  // Sobre (equipe fictícia: o conteúdo real é cadastrado pelo painel)
  const sobre = [
    p('O Cineclube XHY reúne pessoas para ver e pensar cinema juntas, fora dos circuitos comerciais.'),
    p(
      'Além das sessões, publicamos uma revista, catálogos das mostras e textos sobre os filmes exibidos. Tudo o que está neste site foi escrito pela equipe e por convidados.'
    ),
  ];
  await About.create({
    blocks: sobre,
    content: corrido(sobre),
    team: [
      { name: 'ana exemplo', role: 'coordenação', email: 'ana@exemplo.com' },
      { name: 'bruno modelo', role: 'editorial', email: 'bruno@exemplo.com' },
      { name: 'carla teste', role: 'editorial', email: 'carla@exemplo.com' },
    ],
  });

  log('Seed concluído com sucesso!');
  return 'aplicado';
}

export const MENSAGEM_SEM_TERMINAL =
  'Sem terminal interativo para confirmar, então nada foi apagado. ' +
  'No Git Bash (mintty) o Node não enxerga o terminal: rode no cmd ou no PowerShell, ' +
  'use "winpty npm run seed" ou, se tiver certeza, "npm run seed -- --force".';

/** Desistir na pergunta é escolha do usuário (0); sem terminal para perguntar é falha (1). */
export function codigoDeSaida(resultado: 'aplicado' | 'cancelado', temTerminal: boolean): number {
  return resultado === 'cancelado' && !temTerminal ? 1 : 0;
}

function perguntarNoTerminal(pergunta: string): Promise<boolean> {
  // Sem terminal interativo (CI, pipe, Git Bash) não há como confirmar: recusa
  if (!process.stdin.isTTY) {
    console.log(`${pergunta}
${MENSAGEM_SEM_TERMINAL}`);
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
    const resultado = await executarSeed({
      banco: conexao.descricao,
      force: pedeForce(process.argv),
      confirmar: perguntarNoTerminal,
    });
    process.exitCode = codigoDeSaida(resultado, Boolean(process.stdin.isTTY));
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
