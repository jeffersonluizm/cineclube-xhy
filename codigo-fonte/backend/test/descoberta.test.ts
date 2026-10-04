import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app';
import Magazine from '../src/models/Magazine';
import Catalog from '../src/models/Catalog';
import Cycle from '../src/models/Cycle';
import Film from '../src/models/Film';
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
  const r = await Magazine.create({ number: 3, volume: 1, month: 'maio', year: 2026, slug: 'revista-3' });
  const c = await Catalog.create({ title: 'Salomé', slug: 'salome', year: 2024 });
  const ci = await Cycle.create({ title: 'Realizadoras', slug: 'realizadoras', year: 2026 });
  const base = { column: 'crítica', order: 0 };
  await Article.create([
    {
      ...base,
      title: 'Chantal Akerman e o tempo',
      slug: 'chantal',
      author: 'Lúcia Prado',
      content: 'Jeanne Dielman e a cozinha',
      parentType: 'revista',
      parentId: r._id,
    },
    {
      ...base,
      title: 'Salomé no cinema mudo',
      slug: 'salome-mudo',
      author: 'Lúcia Prado',
      content: 'Nazimova e a dança',
      parentType: 'catalogo',
      parentId: c._id,
      order: 1,
    },
    {
      ...base,
      title: 'Agnès Varda na praia',
      slug: 'varda',
      author: 'Bruno Teles',
      content: 'As praias de Agnès',
      parentType: 'ciclo',
      parentId: ci._id,
    },
    {
      ...base,
      title: 'Rascunho sobre Akerman',
      slug: 'rascunho',
      author: 'Lúcia Prado',
      content: 'Akerman inédito',
      published: false,
      parentType: 'revista',
      parentId: r._id,
    },
  ]);
  await Film.create({
    title: 'Jeanne Dielman',
    slug: 'jeanne-dielman',
    director: 'Chantal Akerman',
    year: 1975,
    duration: "201'",
    country: 'Bélgica',
    synopsis: 'Três dias de uma dona de casa',
    cycleId: ci._id,
  });
});

test('busca encontra textos publicados e filmes com o endereço de cada um', async () => {
  const res = await request(app).get('/api/busca').query({ q: 'akerman' });
  assert.equal(res.status, 200);
  assert.deepEqual(
    res.body.textos.map((t: { href: string }) => t.href),
    ['/revista/3/artigo/chantal']
  );
  assert.equal(res.body.textos[0].author, 'Lúcia Prado');
  assert.deepEqual(
    res.body.filmes.map((f: { href: string }) => f.href),
    ['/ciclos-mostras/realizadoras/jeanne-dielman']
  );
});

test('busca ignora acentos e monta endereços de catálogo e ciclo', async () => {
  const salome = await request(app).get('/api/busca').query({ q: 'salome' });
  assert.deepEqual(
    salome.body.textos.map((t: { href: string }) => t.href),
    ['/catalogos/salome/salome-mudo']
  );
  const varda = await request(app).get('/api/busca').query({ q: 'agnes' });
  assert.deepEqual(
    varda.body.textos.map((t: { href: string }) => t.href),
    ['/ciclos-mostras/realizadoras/texto/varda']
  );
});

test('busca recusa termo curto ou longo demais', async () => {
  assert.equal((await request(app).get('/api/busca').query({ q: 'a' })).status, 400);
  assert.equal(
    (
      await request(app)
        .get('/api/busca')
        .query({ q: 'x'.repeat(101) })
    ).status,
    400
  );
  assert.equal((await request(app).get('/api/busca?q[$ne]=x')).status, 400);
});

test('página de autor reúne os textos publicados pelo slug do nome', async () => {
  const res = await request(app).get('/api/autores/lucia-prado');
  assert.equal(res.status, 200);
  assert.equal(res.body.nome, 'Lúcia Prado');
  assert.deepEqual(res.body.textos.map((t: { href: string }) => t.href).sort(), [
    '/catalogos/salome/salome-mudo',
    '/revista/3/artigo/chantal',
  ]);
  assert.equal((await request(app).get('/api/autores/ninguem')).status, 404);
});

test('lista de autores conta só textos publicados', async () => {
  const res = await request(app).get('/api/autores');
  assert.deepEqual(res.body, [
    { nome: 'Bruno Teles', slug: 'bruno-teles', textos: 1 },
    { nome: 'Lúcia Prado', slug: 'lucia-prado', textos: 2 },
  ]);
});

test('recentes traz os últimos textos publicados com endereço, para o RSS', async () => {
  const res = await request(app).get('/api/recentes');
  assert.equal(res.status, 200);
  assert.equal(res.body.length, 3);
  assert.ok(res.body.every((t: { href: string; trecho: string }) => t.href.startsWith('/') && typeof t.trecho === 'string'));
});

test('mapa do site lista páginas de edições, textos, filmes e autores', async () => {
  const res = await request(app).get('/api/mapa');
  const hrefs = res.body.map((p: { href: string }) => p.href);
  for (const esperado of [
    '/revista/3',
    '/revista/3/artigo/chantal',
    '/catalogos/salome',
    '/catalogos/salome/salome-mudo',
    '/ciclos-mostras/realizadoras',
    '/ciclos-mostras/realizadoras/texto/varda',
    '/ciclos-mostras/realizadoras/jeanne-dielman',
    '/autores/lucia-prado',
  ]) {
    assert.ok(hrefs.includes(esperado), esperado);
  }
  assert.ok(!hrefs.includes('/revista/3/artigo/rascunho'));
  assert.ok(res.body.every((p: { atualizado: string }) => !Number.isNaN(Date.parse(p.atualizado))));
});

test('grafias diferentes do mesmo autor viram uma entrada só na lista', async () => {
  const r = await Magazine.findOne();
  await Article.create({
    title: 'Outro texto',
    slug: 'outro-texto',
    author: 'lúcia prado',
    column: 'crítica',
    content: 'x',
    parentType: 'revista',
    parentId: r!._id,
    order: 5,
  });
  const res = await request(app).get('/api/autores');
  const lucia = res.body.filter((a: { slug: string }) => a.slug === 'lucia-prado');
  assert.equal(lucia.length, 1);
  assert.equal(lucia[0].textos, 3);
});
