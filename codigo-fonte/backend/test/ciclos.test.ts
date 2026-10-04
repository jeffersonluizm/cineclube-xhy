import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app';
import Cycle from '../src/models/Cycle';
import Catalog from '../src/models/Catalog';
import Article from '../src/models/Article';
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

async function criarCicloComTextos() {
  const ciclo = await Cycle.create({ title: 'O Tempo do Depois', slug: 'o-tempo-do-depois', year: 2026 });
  const outroCiclo = await Cycle.create({ title: 'Realizadoras', slug: 'realizadoras', year: 2026 });
  const catalogo = await Catalog.create({ title: 'Salomé', slug: 'salome', year: 2024 });
  const base = { author: 'Autora', content: 'texto', parentType: 'ciclo' as const, parentId: ciclo._id };
  await Article.create([
    { ...base, title: 'Segundo', slug: 'segundo', column: 'textos', order: 2 },
    { ...base, title: 'Primeiro', slug: 'primeiro', column: 'textos', order: 1 },
    { ...base, title: 'Tradução', slug: 'traducao', column: 'traduções', order: 3 },
    { ...base, title: 'Rascunho', slug: 'rascunho', column: 'textos', order: 4, published: false },
    { ...base, title: 'De outro ciclo', slug: 'de-outro-ciclo', column: 'textos', parentId: outroCiclo._id },
    { ...base, title: 'De catálogo', slug: 'de-catalogo', column: 'textos', parentType: 'catalogo', parentId: catalogo._id },
  ]);
  return ciclo;
}

test('página do ciclo traz os textos publicados do ciclo agrupados por coluna, em ordem', async () => {
  await criarCicloComTextos();

  const res = await request(app).get('/api/ciclos/o-tempo-do-depois');

  assert.equal(res.status, 200);
  const titulos = Object.fromEntries(
    Object.entries(res.body.sections as Record<string, { title: string }[]>).map(([coluna, arts]) => [
      coluna,
      arts.map((a) => a.title),
    ])
  );
  assert.deepEqual(titulos, { textos: ['Primeiro', 'Segundo'], traduções: ['Tradução'] });
});

test('ciclo sem textos devolve seções vazias', async () => {
  await Cycle.create({ title: 'Vazio', slug: 'vazio', year: 2025 });

  const res = await request(app).get('/api/ciclos/vazio');

  assert.equal(res.status, 200);
  assert.deepEqual(res.body.sections, {});
});

test('texto publicado do ciclo é devolvido com anterior e próximo', async () => {
  await criarCicloComTextos();

  const res = await request(app).get('/api/ciclos/o-tempo-do-depois/texto/segundo');

  assert.equal(res.status, 200);
  assert.equal(res.body.article.title, 'Segundo');
  assert.equal(res.body.cycle.slug, 'o-tempo-do-depois');
  assert.deepEqual(res.body.prev, { title: 'Primeiro', slug: 'primeiro', author: 'Autora' });
  assert.deepEqual(res.body.next, { title: 'Tradução', slug: 'traducao', author: 'Autora' });
});

test('texto não publicado do ciclo dá 404', async () => {
  await criarCicloComTextos();

  const res = await request(app).get('/api/ciclos/o-tempo-do-depois/texto/rascunho');

  assert.equal(res.status, 404);
  assert.equal(res.body.error, 'Texto não encontrado');
});

test('texto de outro ciclo ou de catálogo não abre pelo ciclo', async () => {
  await criarCicloComTextos();

  const deOutroCiclo = await request(app).get('/api/ciclos/o-tempo-do-depois/texto/de-outro-ciclo');
  const deCatalogo = await request(app).get('/api/ciclos/o-tempo-do-depois/texto/de-catalogo');

  assert.equal(deOutroCiclo.status, 404);
  assert.equal(deCatalogo.status, 404);
  assert.equal(deOutroCiclo.body.error, 'Texto não encontrado');
  assert.equal(deCatalogo.body.error, 'Texto não encontrado');
});

test('texto de ciclo inexistente dá 404', async () => {
  const res = await request(app).get('/api/ciclos/nao-existe/texto/primeiro');

  assert.equal(res.status, 404);
  assert.equal(res.body.error, 'Ciclo não encontrado');
});
