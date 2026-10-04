import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app';
import { signToken } from '../src/middleware/auth';
import Article from '../src/models/Article';
import Film from '../src/models/Film';
import { abrirBancoEmMemoria } from './helpers/bancoEmMemoria';

let banco: Awaited<ReturnType<typeof abrirBancoEmMemoria>>;
let auth: string;

before(async () => {
  banco = await abrirBancoEmMemoria();
  auth = `Bearer ${signToken()}`;
});
after(async () => {
  await banco.fechar();
});
beforeEach(async () => {
  await banco.limpar();
});

const get = (url: string) => request(app).get(url).set('Authorization', auth);
const post = (url: string, corpo: object) => request(app).post(url).set('Authorization', auth).send(corpo);
const put = (url: string, corpo: object) => request(app).put(url).set('Authorization', auth).send(corpo);
const del = (url: string) => request(app).delete(url).set('Authorization', auth);

const novaRevista = (n = 1) => post('/api/admin/revistas', { number: n, volume: 1, month: 'março', year: 2026 });
const novoTexto = (parentId: string, extra: object = {}) =>
  post('/api/admin/artigos', {
    title: 'Um texto',
    author: 'Ana',
    column: 'crítica',
    blocks: [
      { type: 'paragraph', text: 'linha um' },
      { type: 'image', src: '/uploads/1-a.png' },
      { type: 'quote', text: 'linha dois' },
    ],
    parentType: 'revista',
    parentId,
    ...extra,
  });

test('rotas do painel exigem token', async () => {
  assert.equal((await request(app).get('/api/admin/revistas')).status, 401);
  assert.equal((await request(app).get('/api/admin/revistas').set('Authorization', 'Bearer xyz')).status, 401);
});

test('revistas: cria, recusa incompleta e duplicada, edita e lista', async () => {
  const criada = await novaRevista(3);
  assert.equal(criada.status, 201);
  assert.equal(criada.body.slug, 'revista-3');

  assert.equal((await post('/api/admin/revistas', { number: 4 })).status, 400);
  const dup = await novaRevista(3);
  assert.equal(dup.status, 409);
  assert.equal(dup.body.error, 'Já existe uma revista com esse número');

  const editada = await put(`/api/admin/revistas/${criada.body._id}`, { month: 'abril', number: 5 });
  assert.equal(editada.status, 200);
  assert.equal(editada.body.month, 'abril');
  assert.equal(editada.body.slug, 'revista-5');

  await novaRevista(1);
  const lista = await get('/api/admin/revistas');
  assert.deepEqual(lista.body.map((m: { number: number }) => m.number), [5, 1]);

  assert.equal((await put('/api/admin/revistas/0123456789abcdef01234567', { month: 'x' })).status, 404);
});

test('excluir revista apaga os textos dela', async () => {
  const r = (await novaRevista()).body;
  await novoTexto(r._id);
  assert.equal((await del(`/api/admin/revistas/${r._id}`)).status, 200);
  assert.equal(await Article.countDocuments(), 0);
  assert.equal((await del(`/api/admin/revistas/${r._id}`)).status, 404);
});

test('artigos: cria com slug único, ordem crescente e texto corrido sem imagens', async () => {
  const r = (await novaRevista()).body;
  const a1 = await novoTexto(r._id);
  const a2 = await novoTexto(r._id);
  assert.equal(a1.status, 201);
  assert.equal(a1.body.slug, 'um-texto');
  assert.equal(a2.body.slug, 'um-texto-2');
  assert.equal(a1.body.order, 0);
  assert.equal(a2.body.order, 1);
  assert.equal(a1.body.content, 'linha um\nlinha dois');
  assert.equal(a1.body.published, true);

  const incompleto = await post('/api/admin/artigos', { title: 'x' });
  assert.equal(incompleto.status, 400);
});

test('criações simultâneas com o mesmo título recebem slugs distintos, sem erro', async () => {
  const r = (await novaRevista()).body;
  const respostas = await Promise.all(Array.from({ length: 12 }, () => novoTexto(r._id)));
  assert.deepEqual(respostas.map((x) => x.status), Array(12).fill(201));
  const slugs = new Set(respostas.map((x) => x.body.slug));
  assert.equal(slugs.size, 12);
  assert.ok(slugs.has('um-texto'));
});

test('artigos: edita recalculando o texto corrido, lista por revista e reordena', async () => {
  const r = (await novaRevista()).body;
  const a1 = (await novoTexto(r._id)).body;
  const a2 = (await novoTexto(r._id, { title: 'Outro' })).body;

  const edit = await put(`/api/admin/artigos/${a1._id}`, { blocks: [{ type: 'paragraph', text: 'novo' }], published: false });
  assert.equal(edit.status, 200);
  assert.equal(edit.body.content, 'novo');
  assert.equal(edit.body.published, false);

  assert.equal((await put('/api/admin/artigos/reorder', { ids: [a2._id, a1._id] })).status, 200);
  const lista = await get(`/api/admin/artigos?parentId=${r._id}`);
  assert.deepEqual(lista.body.map((a: { title: string }) => a.title), ['Outro', 'Um texto']);

  assert.equal((await put('/api/admin/artigos/reorder', {})).status, 400);
  const um = await get(`/api/admin/artigos/${a1._id}`);
  assert.equal(um.body.title, 'Um texto');
  assert.equal((await del(`/api/admin/artigos/${a1._id}`)).status, 200);
  assert.equal((await get(`/api/admin/artigos/${a1._id}`)).status, 404);
});

test('catálogos: cria com slug, edita e excluir apaga os textos', async () => {
  const c = await post('/api/admin/catalogos', { title: 'Sirk & Fassbinder', year: 2024 });
  assert.equal(c.status, 201);
  assert.equal(c.body.slug, 'sirk-fassbinder');
  assert.equal((await post('/api/admin/catalogos', { title: 'Sem ano' })).status, 400);
  await novoTexto(c.body._id, { parentType: 'catalogo' });

  const e = await put(`/api/admin/catalogos/${c.body._id}`, { description: 'nova' });
  assert.equal(e.body.description, 'nova');

  assert.equal((await del(`/api/admin/catalogos/${c.body._id}`)).status, 200);
  assert.equal(await Article.countDocuments(), 0);
});

test('ciclos e filmes: CRUD, reordenação e exclusão em cascata', async () => {
  const c = await post('/api/admin/ciclos', { title: 'O Tempo do Depois', year: 2026, screenings: [] });
  assert.equal(c.status, 201);
  const ciclo = c.body;

  const filme = (titulo: string) =>
    post('/api/admin/filmes', { title: titulo, director: 'D', year: 2000, duration: "90'", country: 'BR', synopsis: 's', cycleId: ciclo._id });
  const f1 = (await filme('Primeiro filme')).body;
  const f2 = (await filme('Segundo filme')).body;
  assert.equal(f1.slug, 'primeiro-filme');
  assert.equal(f2.order, 1);
  assert.equal((await post('/api/admin/filmes', { title: 'sem ficha' })).status, 400);

  assert.equal((await put('/api/admin/filmes/reorder', { ids: [f2._id, f1._id] })).status, 200);
  const lista = await get(`/api/admin/filmes?cycleId=${ciclo._id}`);
  assert.deepEqual(lista.body.map((f: { title: string }) => f.title), ['Segundo filme', 'Primeiro filme']);

  const ed = await put(`/api/admin/filmes/${f1._id}`, { synopsis: 'nova sinopse' });
  assert.equal(ed.body.synopsis, 'nova sinopse');
  assert.equal((await get(`/api/admin/filmes/${f1._id}`)).body.synopsis, 'nova sinopse');

  await novoTexto(ciclo._id, { parentType: 'ciclo' });
  assert.equal((await put(`/api/admin/ciclos/${ciclo._id}`, { subtitle: 'sub' })).body.subtitle, 'sub');
  assert.equal((await del(`/api/admin/ciclos/${ciclo._id}`)).status, 200);
  assert.equal(await Film.countDocuments(), 0);
  assert.equal(await Article.countDocuments(), 0);
});

test('sobre: devolve vazio sem dados, exige blocos e salva a equipe', async () => {
  const vazio = await get('/api/admin/sobre');
  assert.deepEqual(vazio.body, { content: '', blocks: [], team: [] });
  assert.equal((await put('/api/admin/sobre', { blocks: [] })).status, 400);
  const ok = await put('/api/admin/sobre', {
    blocks: [{ type: 'paragraph', text: 'Somos um cineclube.' }],
    team: [{ name: 'Ana', role: 'coordenação', links: [{ label: 'Instagram', url: 'https://instagram.com/x' }] }],
  });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.content, 'Somos um cineclube.');
  assert.equal(ok.body.team[0].links[0].label, 'Instagram');
});
