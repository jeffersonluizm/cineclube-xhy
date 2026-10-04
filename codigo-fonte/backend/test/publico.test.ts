import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app';
import Magazine from '../src/models/Magazine';
import Catalog from '../src/models/Catalog';
import Cycle from '../src/models/Cycle';
import Film from '../src/models/Film';
import Article from '../src/models/Article';
import About from '../src/models/About';
import { abrirBancoEmMemoria } from './helpers/bancoEmMemoria';

let banco: Awaited<ReturnType<typeof abrirBancoEmMemoria>>;

before(async () => {
  banco = await abrirBancoEmMemoria();
});
after(async () => {
  await banco.fechar();
});
beforeEach(async () => {
  await banco.limpar();
});

const texto = (extra: Record<string, unknown>) => ({
  author: 'Ana Prado',
  column: 'crítica',
  content: 'primeira linha\nsegunda linha',
  blocks: [{ type: 'paragraph', text: 'primeira linha' }],
  ...extra,
});

async function criarRevistas() {
  const r1 = await Magazine.create({ number: 1, volume: 1, month: 'março', year: 2025, slug: 'revista-1' });
  const r2 = await Magazine.create({ number: 2, volume: 1, month: 'junho', year: 2026, slug: 'revista-2' });
  await Article.create([
    texto({ title: 'Terceiro', slug: 'terceiro', order: 2, parentType: 'revista', parentId: r2._id }),
    texto({ title: 'Primeiro', slug: 'primeiro', order: 0, parentType: 'revista', parentId: r2._id }),
    texto({
      title: 'Segundo',
      slug: 'segundo',
      order: 1,
      parentType: 'revista',
      parentId: r2._id,
      column: 'ensaio',
      author: 'Bruno Teles',
    }),
    texto({ title: 'Rascunho', slug: 'rascunho', order: 3, parentType: 'revista', parentId: r2._id, published: false }),
    texto({ title: 'Da edição 1', slug: 'da-edicao-1', order: 0, parentType: 'revista', parentId: r1._id }),
  ]);
  return { r1, r2 };
}

test('home destaca a revista mais recente e lista as edições com textos publicados', async () => {
  await criarRevistas();
  const res = await request(app).get('/api/home');
  assert.equal(res.status, 200);
  assert.equal(res.body.latest.type, 'revista');
  assert.equal(res.body.latest.data.number, 2);
  assert.deepEqual(
    res.body.latest.articles.map((a: { title: string }) => a.title),
    ['Primeiro', 'Segundo', 'Terceiro']
  );
  assert.deepEqual(
    res.body.editions.map((e: { magazine: { number: number } }) => e.magazine.number),
    [2, 1]
  );
  assert.deepEqual(
    res.body.editions[0].articles.map((a: { title: string }) => a.title),
    ['Primeiro', 'Segundo', 'Terceiro']
  );
});

test('home sem conteúdo devolve latest nulo e nenhuma edição', async () => {
  const res = await request(app).get('/api/home');
  assert.equal(res.status, 200);
  assert.equal(res.body.latest, null);
  assert.deepEqual(res.body.editions, []);
});

test('home destaca o catálogo quando ele é mais novo que a última revista', async () => {
  await criarRevistas();
  await new Promise((r) => setTimeout(r, 5));
  await Catalog.create({ title: 'Salomé', slug: 'salome', year: 2026 });
  const res = await request(app).get('/api/home');
  assert.equal(res.body.latest.type, 'catalogo');
  assert.equal(res.body.latest.data.slug, 'salome');
});

test('lista de revistas vem da maior para a menor', async () => {
  await criarRevistas();
  const res = await request(app).get('/api/revista');
  assert.deepEqual(
    res.body.map((m: { number: number }) => m.number),
    [2, 1]
  );
});

test('sumário agrupa textos publicados por coluna, em ordem, sem rascunhos', async () => {
  await criarRevistas();
  const res = await request(app).get('/api/revista/2');
  assert.equal(res.status, 200);
  assert.equal(res.body.magazine.number, 2);
  const colunas = Object.fromEntries(
    Object.entries(res.body.columns as Record<string, { title: string }[]>).map(([c, arts]) => [c, arts.map((a) => a.title)])
  );
  assert.deepEqual(colunas, { crítica: ['Primeiro', 'Terceiro'], ensaio: ['Segundo'] });
  const primeiro = res.body.columns['crítica'][0];
  assert.equal(primeiro.slug, 'primeiro');
  assert.equal(primeiro.author, 'Ana Prado');
  assert.equal(primeiro.trecho, 'primeira linha segunda linha', 'o sumário mostra um trecho do texto');
  assert.equal(primeiro.blocks, undefined, 'o sumário não carrega o corpo do texto');
  assert.equal(primeiro.content, undefined);
});

test('home faz um número fixo de consultas, qualquer que seja o número de edições', async () => {
  for (let n = 10; n < 40; n++) await Magazine.create({ number: n, volume: 1, month: 'maio', year: 2026, slug: `revista-${n}` });
  await criarRevistas();
  const mongoose = (await import('mongoose')).default;
  let consultas = 0;
  mongoose.set('debug', () => consultas++);
  try {
    const res = await request(app).get('/api/home');
    assert.equal(res.status, 200);
    assert.equal(res.body.editions.length, 32);
  } finally {
    mongoose.set('debug', false);
  }
  assert.ok(consultas <= 6, `home fez ${consultas} consultas`);
});

test('vizinhos do artigo não trazem o corpo dos outros textos', async () => {
  await criarRevistas();
  const res = await request(app).get('/api/revista/2/artigo/segundo');
  assert.deepEqual(Object.keys(res.body.prev).sort(), ['author', 'slug', 'title']);
});

test('revista inexistente responde 404', async () => {
  const res = await request(app).get('/api/revista/99');
  assert.equal(res.status, 404);
  assert.equal(res.body.error, 'Revista não encontrada');
});

test('artigo traz o texto completo e os vizinhos publicados', async () => {
  await criarRevistas();
  const res = await request(app).get('/api/revista/2/artigo/segundo');
  assert.equal(res.status, 200);
  assert.equal(res.body.article.title, 'Segundo');
  assert.deepEqual(res.body.article.blocks[0].text, 'primeira linha');
  assert.equal(res.body.magazine.number, 2);
  assert.deepEqual(res.body.prev, { title: 'Primeiro', slug: 'primeiro', author: 'Ana Prado' });
  assert.deepEqual(res.body.next, { title: 'Terceiro', slug: 'terceiro', author: 'Ana Prado' });
});

test('primeiro artigo não tem anterior e rascunho não é público', async () => {
  await criarRevistas();
  const primeiro = await request(app).get('/api/revista/2/artigo/primeiro');
  assert.equal(primeiro.body.prev, null);
  const rascunho = await request(app).get('/api/revista/2/artigo/rascunho');
  assert.equal(rascunho.status, 404);
  const deOutra = await request(app).get('/api/revista/2/artigo/da-edicao-1');
  assert.equal(deOutra.status, 404);
});

test('catálogos: lista por ano, detalhe por seção e texto com vizinhos', async () => {
  const c = await Catalog.create({ title: 'Salomé', slug: 'salome', year: 2024 });
  await Catalog.create({ title: 'Atrizes', slug: 'atrizes', year: 2025 });
  await Article.create([
    texto({ title: 'Apresentação', slug: 'apresentacao', column: 'abertura', order: 0, parentType: 'catalogo', parentId: c._id }),
    texto({ title: 'Ensaio', slug: 'ensaio', column: 'textos', order: 1, parentType: 'catalogo', parentId: c._id }),
  ]);

  const lista = await request(app).get('/api/catalogos');
  assert.deepEqual(
    lista.body.map((x: { slug: string }) => x.slug),
    ['atrizes', 'salome']
  );

  const det = await request(app).get('/api/catalogos/salome');
  assert.equal(det.status, 200);
  assert.deepEqual(Object.keys(det.body.sections), ['abertura', 'textos']);
  assert.equal(det.body.sections.textos[0].trecho, 'primeira linha segunda linha');
  assert.equal(det.body.sections.textos[0].blocks, undefined);

  const t = await request(app).get('/api/catalogos/salome/texto/ensaio');
  assert.equal(t.status, 200);
  assert.equal(t.body.prev.slug, 'apresentacao');
  assert.equal(t.body.next, null);

  assert.equal((await request(app).get('/api/catalogos/nada')).status, 404);
  assert.equal((await request(app).get('/api/catalogos/salome/texto/nada')).status, 404);
});

test('filme do ciclo traz ficha e vizinhos pela ordem', async () => {
  const ciclo = await Cycle.create({ title: 'Realizadoras', slug: 'realizadoras', year: 2026 });
  const base = { director: 'Diretora', year: 2000, duration: "90'", country: 'Brasil', synopsis: 's', cycleId: ciclo._id };
  await Film.create([
    { ...base, title: 'A', slug: 'a', order: 0 },
    { ...base, title: 'B', slug: 'b', order: 1 },
    { ...base, title: 'C', slug: 'c', order: 2 },
  ]);

  const res = await request(app).get('/api/ciclos/realizadoras/filme/b');
  assert.equal(res.status, 200);
  assert.equal(res.body.film.title, 'B');
  assert.deepEqual(res.body.prev, { title: 'A', slug: 'a', director: 'Diretora' });
  assert.deepEqual(res.body.next, { title: 'C', slug: 'c', director: 'Diretora' });
  assert.equal((await request(app).get('/api/ciclos/realizadoras/filme/z')).status, 404);
  assert.equal((await request(app).get('/api/ciclos/nada/filme/a')).status, 404);
});

test('sobre responde 404 sem dados e 200 com a equipe', async () => {
  assert.equal((await request(app).get('/api/sobre')).status, 404);
  await About.create({ content: 'x', blocks: [{ type: 'paragraph', text: 'x' }], team: [{ name: 'Ana', role: 'coordenação' }] });
  const res = await request(app).get('/api/sobre');
  assert.equal(res.status, 200);
  assert.equal(res.body.team[0].name, 'Ana');
});
