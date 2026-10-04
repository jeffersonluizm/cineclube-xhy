// Gera a massa de dados da carga direto no MongoDB descartável (driver puro, sem os models
// da API), para que a mesma massa sirva ao código de antes e ao de depois das correções.
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const requireBackend = createRequire(path.join(raiz, 'codigo-fonte/backend/package.json'));
const { MongoClient } = requireBackend('mongodb');

const COLUNAS = ['crítica', 'ensaio', 'entrevista', 'tradução'];
const AUTORES = ['Ana Lúcia Prado', 'Bruno Teles', 'Clara Monte', 'Davi Ramos', 'Elisa Fontes', 'Fábio Nunes'];
const MESES = ['janeiro', 'março', 'maio', 'julho', 'setembro', 'novembro'];

// ~600 caracteres por parágrafo: um texto de 25 blocos fica com ~15 kB, perto de um ensaio real
const PARAGRAFO =
  'O plano se demora sobre a parede descascada enquanto a luz da tarde atravessa a janela e ' +
  'desenha no chão um retângulo que avança devagar. Nada acontece, e é justamente essa espera ' +
  'que o filme oferece ao espectador como matéria: o tempo como algo que se vê passar. A montagem ' +
  'recusa o corte que resolveria a cena, e o som de fora, um rádio distante, uma moto, crianças, ' +
  'insiste em lembrar que o mundo continua do lado de lá do quadro. Há nisso uma ética do olhar ' +
  'que o cineclube discute há anos: filmar é também decidir quanto tempo se dá a cada coisa.';

function slug(texto) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function blocos(n) {
  return Array.from({ length: n }, (_, i) =>
    i % 8 === 4
      ? { type: 'quote', text: 'O cinema é uma forma de pensar com as mãos.', align: 'full', width: 'large' }
      : { type: 'paragraph', text: `${i + 1}. ${PARAGRAFO}`, align: 'full', width: 'large' }
  );
}

function texto({ titulo, i, parentType, parentId, ordem, publicado = true, nBlocos = 25 }) {
  const bs = blocos(nBlocos);
  const agora = new Date(Date.UTC(2026, 0, 1) + i * 3600_000);
  return {
    title: titulo,
    slug: slug(titulo),
    author: AUTORES[i % AUTORES.length],
    column: COLUNAS[i % COLUNAS.length],
    epigraph: 'Ver é já uma maneira de escolher.',
    content: bs.map((b) => b.text).join('\n'),
    blocks: bs,
    footnotes: ['Nota de exemplo gerada para a carga.'],
    images: [],
    published: publicado,
    order: ordem,
    parentType,
    parentId,
    createdAt: agora,
    updatedAt: agora,
  };
}

/**
 * Apaga e recria a massa: `revistas` edições com `textosPorRevista` textos cada,
 * 10 catálogos com 10 textos e 20 ciclos com 25 filmes e 5 textos.
 * Devolve os endereços usados pelos cenários.
 */
export async function popular(uri, { revistas = 30, textosPorRevista = 15 } = {}) {
  const cliente = new MongoClient(uri);
  await cliente.connect();
  const db = cliente.db();
  try {
    for (const nome of ['magazines', 'articles', 'catalogs', 'cycles', 'films', 'abouts']) {
      await db.collection(nome).deleteMany({});
    }

    let contador = 0;
    const artigos = [];
    const revistasDocs = [];
    for (let n = 1; n <= revistas; n++) {
      const criada = new Date(Date.UTC(2020, 0, 1) + n * 86400_000 * 30);
      revistasDocs.push({
        number: n,
        volume: Math.ceil(n / 6),
        month: MESES[n % MESES.length],
        year: 2020 + Math.floor(n / 6),
        coverImage: '',
        editorial: `Editorial da edição ${n}. ${PARAGRAFO}`,
        slug: `revista-${n}`,
        createdAt: criada,
        updatedAt: criada,
      });
    }
    const { insertedIds: idsRevistas } = await db.collection('magazines').insertMany(revistasDocs);
    for (let r = 0; r < revistas; r++) {
      for (let t = 0; t < textosPorRevista; t++) {
        artigos.push(
          texto({
            titulo: `Texto ${t + 1} da revista ${r + 1}`,
            i: contador++,
            parentType: 'revista',
            parentId: idsRevistas[r],
            ordem: t,
            publicado: t !== textosPorRevista - 1, // o último de cada edição é rascunho
          })
        );
      }
    }

    const catalogos = Array.from({ length: 10 }, (_, c) => ({
      title: `Catálogo de carga ${c + 1}`,
      slug: `catalogo-de-carga-${c + 1}`,
      year: 2020 + (c % 6),
      coverImage: '',
      description: 'Catálogo gerado para a carga.',
      createdAt: new Date(Date.UTC(2019, 0, 1)),
      updatedAt: new Date(Date.UTC(2019, 0, 1)),
    }));
    const { insertedIds: idsCatalogos } = await db.collection('catalogs').insertMany(catalogos);
    for (let c = 0; c < catalogos.length; c++) {
      for (let t = 0; t < 10; t++) {
        artigos.push(
          texto({ titulo: `Texto ${t + 1} do catálogo ${c + 1}`, i: contador++, parentType: 'catalogo', parentId: idsCatalogos[c], ordem: t })
        );
      }
    }

    const ciclos = Array.from({ length: 20 }, (_, c) => ({
      title: `Ciclo de carga ${c + 1}`,
      subtitle: 'subtítulo',
      slug: `ciclo-de-carga-${c + 1}`,
      year: 2020 + (c % 6),
      coverImage: '',
      description: 'Ciclo gerado para a carga.',
      footnotes: [],
      screenings: [],
      createdAt: new Date(Date.UTC(2019, 0, 1)),
      updatedAt: new Date(Date.UTC(2019, 0, 1)),
    }));
    const { insertedIds: idsCiclos } = await db.collection('cycles').insertMany(ciclos);
    const filmes = [];
    for (let c = 0; c < ciclos.length; c++) {
      for (let f = 0; f < 25; f++) {
        const titulo = `Filme ${f + 1} do ciclo ${c + 1}`;
        filmes.push({
          title: titulo,
          slug: slug(titulo),
          director: AUTORES[f % AUTORES.length],
          year: 1960 + f,
          duration: "100'",
          country: 'Brasil',
          image: '',
          synopsis: 'Sinopse gerada para a carga.',
          content: PARAGRAFO,
          footnotes: [],
          cycleId: idsCiclos[c],
          order: f,
          createdAt: new Date(Date.UTC(2019, 0, 1)),
          updatedAt: new Date(Date.UTC(2019, 0, 1)),
        });
      }
      for (let t = 0; t < 5; t++) {
        artigos.push(
          texto({ titulo: `Texto ${t + 1} do ciclo ${c + 1}`, i: contador++, parentType: 'ciclo', parentId: idsCiclos[c], ordem: t })
        );
      }
    }
    const { insertedIds: idsFilmes } = await db.collection('films').insertMany(filmes);
    // Sessões também apontam para o filme pelo id (o código novo usa filmId; o antigo ignora o campo)
    for (let c = 0; c < ciclos.length; c++) {
      const sessoes = filmes
        .map((f, i) => ({ f, id: idsFilmes[i] }))
        .filter(({ f }) => String(f.cycleId) === String(idsCiclos[c]))
        .map(({ f, id }, k) => ({
          date: `${String((k % 28) + 1).padStart(2, '0')}.03`,
          time: '19h',
          filmTitle: f.title,
          filmSlug: f.slug,
          filmId: id,
          director: f.director,
          duration: f.duration,
          country: f.country,
        }));
      await db.collection('cycles').updateOne({ _id: idsCiclos[c] }, { $set: { screenings: sessoes } });
    }

    await db.collection('articles').insertMany(artigos);
    await db.collection('abouts').insertOne({
      content: 'Cineclube de carga.',
      blocks: [{ type: 'paragraph', text: 'Cineclube de carga.', align: 'full', width: 'large' }],
      team: [{ name: 'Equipe', role: 'coordenação', email: 'contato@example.com', links: [] }],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return {
      revistas,
      textos: artigos.length,
      filmes: filmes.length,
      // edição mais recente e um texto do meio dela
      revistaAlvo: revistas,
      textoAlvo: slug(`Texto ${Math.ceil(textosPorRevista / 2)} da revista ${revistas}`),
      cicloAlvo: 'ciclo-de-carga-1',
      filmeAlvo: slug('Filme 13 do ciclo 1'),
      textoCicloAlvo: slug('Texto 3 do ciclo 1'),
    };
  } finally {
    await cliente.close();
  }
}
