import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app';
import { signToken } from '../src/middleware/auth';
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

const novaRevista = (n = 1) => post('/api/admin/revistas', { number: n, volume: 1, month: 'março', year: 2026 });
const textoValido = (parentId: string) => ({
  title: 'Um texto',
  author: 'Ana',
  column: 'crítica',
  blocks: [{ type: 'paragraph', text: 'linha' }],
  parentType: 'revista',
  parentId,
});

test('revista com número que não é número responde 400 com mensagem em português', async () => {
  const res = await post('/api/admin/revistas', { number: 'abc', volume: 1, month: 'março', year: 2026 });
  assert.equal(res.status, 400);
  assert.match(res.body.error, /número/i);
});

test('editar revista para um número já usado responde 409, não 500', async () => {
  await novaRevista(1);
  const r2 = (await novaRevista(2)).body;
  const res = await put(`/api/admin/revistas/${r2._id}`, { number: 1 });
  assert.equal(res.status, 409);
  assert.equal(res.body.error, 'Já existe uma revista com esse número');
});

test('bloco de tipo desconhecido é recusado também na edição', async () => {
  const r = (await novaRevista()).body;
  const a = (await post('/api/admin/artigos', textoValido(r._id))).body;
  const res = await put(`/api/admin/artigos/${a._id}`, { blocks: [{ type: 'script', text: 'x' }] });
  assert.equal(res.status, 400);
});

test('filtro por parentId não aceita operadores do MongoDB', async () => {
  const res = await get('/api/admin/artigos?parentId[$ne]=x');
  assert.equal(res.status, 400);
});

test('id malformado responde 400, não 500', async () => {
  assert.equal((await get('/api/admin/artigos/123')).status, 400);
  assert.equal((await put('/api/admin/filmes/abc', { title: 'x' })).status, 400);
});

test('links da equipe só podem ser https ou mailto', async () => {
  const res = await put('/api/admin/sobre', {
    blocks: [{ type: 'paragraph', text: 'Somos um cineclube.' }],
    team: [{ name: 'Ana', role: 'coordenação', links: [{ label: 'site', url: 'javascript:alert(1)' }] }],
  });
  assert.equal(res.status, 400);
  assert.match(res.body.error, /https/);
});

test('capa do texto aceita upload local ou https e recusa outros esquemas', async () => {
  const r = (await novaRevista()).body;
  const ruim = await post('/api/admin/artigos', { ...textoValido(r._id), coverImage: 'javascript:alert(1)' });
  assert.equal(ruim.status, 400);
  const bom = await post('/api/admin/artigos', { ...textoValido(r._id), coverImage: '/uploads/1-capa.png' });
  assert.equal(bom.status, 201);
  assert.equal(bom.body.coverImage, '/uploads/1-capa.png');
});

test('busca de um item do painel pelo id', async () => {
  const r = (await novaRevista(7)).body;
  const c = (await post('/api/admin/catalogos', { title: 'Salomé', year: 2024 })).body;
  const ci = (await post('/api/admin/ciclos', { title: 'Realizadoras', year: 2026 })).body;
  assert.equal((await get(`/api/admin/revistas/${r._id}`)).body.number, 7);
  assert.equal((await get(`/api/admin/catalogos/${c._id}`)).body.title, 'Salomé');
  assert.equal((await get(`/api/admin/ciclos/${ci._id}`)).body.title, 'Realizadoras');
  assert.equal((await get('/api/admin/revistas/0123456789abcdef01234567')).status, 404);
});

test('impacto da exclusão conta o que vai junto', async () => {
  const r = (await novaRevista()).body;
  await post('/api/admin/artigos', textoValido(r._id));
  await post('/api/admin/artigos', { ...textoValido(r._id), published: false });
  const ci = (await post('/api/admin/ciclos', { title: 'Realizadoras', year: 2026 })).body;
  await post('/api/admin/filmes', { title: 'F', director: 'D', year: 2000, duration: "90'", country: 'BR', synopsis: 's', cycleId: ci._id });
  await post('/api/admin/artigos', { ...textoValido(ci._id), parentType: 'ciclo' });

  assert.deepEqual((await get(`/api/admin/revistas/${r._id}/impacto`)).body, { textos: 2 });
  assert.deepEqual((await get(`/api/admin/ciclos/${ci._id}/impacto`)).body, { textos: 1, filmes: 1 });
});

test('sessões do ciclo guardam o id do filme', async () => {
  const ci = (await post('/api/admin/ciclos', { title: 'Realizadoras', year: 2026 })).body;
  const f = (await post('/api/admin/filmes', { title: 'Vanda', director: 'Pedro Costa', year: 2000, duration: "171'", country: 'Portugal', synopsis: 's', cycleId: ci._id })).body;
  const res = await put(`/api/admin/ciclos/${ci._id}`, {
    screenings: [{ date: '09.03', time: '19h', filmTitle: 'No Quarto da Vanda', filmId: f._id, director: 'Pedro Costa', duration: "171'", country: 'Portugal' }],
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.screenings[0].filmId, f._id);
});

test('resumo do painel conta conteúdo, rascunhos e últimos editados', async () => {
  const r = (await novaRevista()).body;
  await post('/api/admin/artigos', textoValido(r._id));
  await post('/api/admin/artigos', { ...textoValido(r._id), title: 'Rascunho', published: false });
  await post('/api/admin/catalogos', { title: 'Salomé', year: 2024 });

  const res = await get('/api/admin/resumo');
  assert.equal(res.status, 200);
  assert.equal(res.body.contagens.revistas, 1);
  assert.equal(res.body.contagens.catalogos, 1);
  assert.equal(res.body.contagens.ciclos, 0);
  assert.equal(res.body.contagens.textosPublicados, 1);
  assert.equal(res.body.contagens.rascunhos, 1);
  assert.deepEqual(res.body.rascunhos.map((t: { title: string }) => t.title), ['Rascunho']);
  assert.equal(res.body.ultimosEditados[0].title, 'Rascunho');
  assert.equal(res.body.ultimosEditados[0].onde, 'revista n°1');
});
