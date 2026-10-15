// Teto de volume da demonstração pública: um visitante não consegue encher o banco
import { test, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import app from '../src/app';
import Magazine from '../src/models/Magazine';
import { signToken } from '../src/middleware/auth';
import { criarLimitadorEscritaDemo, TETOS_DEMO } from '../src/middleware/demo';
import { abrirBancoEmMemoria } from './helpers/bancoEmMemoria';

let banco: Awaited<ReturnType<typeof abrirBancoEmMemoria>>;
before(async () => {
  banco = await abrirBancoEmMemoria();
});
after(async () => {
  await banco?.fechar();
});
beforeEach(async () => {
  await banco.limpar();
  process.env.DEMO_ENABLED = 'true';
});
afterEach(() => {
  for (const k of ['DEMO_ENABLED', 'DEMO_TETO_REVISTAS']) delete process.env[k];
});

const auth = () => ({ Authorization: `Bearer ${signToken()}` });
const novaRevista = (n: number) => ({ number: n, volume: 1, month: 'maio', year: 2026 });

test('tetos padrão cobrem todas as coleções que o editor cria', () => {
  assert.deepEqual(Object.keys(TETOS_DEMO).sort(), ['catalogos', 'ciclos', 'filmes', 'revistas', 'textos']);
  assert.equal(TETOS_DEMO.revistas.padrao, 50);
  assert.equal(TETOS_DEMO.textos.padrao, 300);
});

test('na demonstração, passar do teto de revistas responde 409 em português; o teto é configurável', async () => {
  process.env.DEMO_TETO_REVISTAS = '2';
  for (const n of [1, 2]) assert.equal((await request(app).post('/api/admin/revistas').set(auth()).send(novaRevista(n))).status, 201);
  const res = await request(app).post('/api/admin/revistas').set(auth()).send(novaRevista(3));
  assert.equal(res.status, 409);
  assert.equal(res.body.error, 'A demonstração chegou ao limite de 2 revistas. Exclua alguma ou espere o próximo reset.');
  assert.equal(await Magazine.countDocuments(), 2);
});

test('fora da demonstração não há teto', async () => {
  delete process.env.DEMO_ENABLED;
  process.env.DEMO_TETO_REVISTAS = '1';
  for (const n of [1, 2]) assert.equal((await request(app).post('/api/admin/revistas').set(auth()).send(novaRevista(n))).status, 201);
});

test('na demonstração o corpo JSON passa de 256 kB → 413; fora dela o limite é o normal', async () => {
  const grande = { ...novaRevista(9), editorial: 'a'.repeat(300 * 1024) };
  const demo = await request(app).post('/api/admin/revistas').set(auth()).send(grande);
  assert.equal(demo.status, 413);
  delete process.env.DEMO_ENABLED;
  const normal = await request(app).post('/api/admin/revistas').set(auth()).send(grande);
  assert.notEqual(normal.status, 413, 'sem a demonstração, 300 kB passa pelo parser (o zod decide o resto)');
});

test('um texto legítimo grande (25 blocos de 2.000 caracteres e editorial de 20 mil) cabe nos 256 kB', () => {
  const texto = {
    title: 't',
    author: 'a',
    column: 'c',
    blocks: Array.from({ length: 25 }, () => ({ type: 'paragraph', text: 'á'.repeat(2000) })),
  };
  assert.ok(Buffer.byteLength(JSON.stringify(texto)) < 256 * 1024);
  assert.ok(Buffer.byteLength(JSON.stringify({ editorial: 'ç'.repeat(20000) })) < 256 * 1024);
});

test('limitador de escrita da demonstração: N escritas por hora por IP, leituras não contam', async () => {
  const mini = express();
  mini.use(criarLimitadorEscritaDemo({ DEMO_ENABLED: 'true', DEMO_ESCRITAS_POR_HORA: '3' }));
  mini.all('/x', (_req, res) => res.json({ ok: true }));
  for (let i = 0; i < 5; i++) assert.equal((await request(mini).get('/x')).status, 200);
  for (let i = 0; i < 3; i++) assert.equal((await request(mini).post('/x')).status, 200);
  const res = await request(mini).delete('/x');
  assert.equal(res.status, 429);
  assert.match(res.body.error, /demonstração/);
});

test('limitador de escrita desligado fora da demonstração', async () => {
  const mini = express();
  mini.use(criarLimitadorEscritaDemo({ DEMO_ESCRITAS_POR_HORA: '1' }));
  mini.post('/x', (_req, res) => res.json({ ok: true }));
  for (let i = 0; i < 3; i++) assert.equal((await request(mini).post('/x')).status, 200);
});

test('/api/home: sem editorial e com número limitado de edições', async () => {
  delete process.env.DEMO_ENABLED;
  for (let n = 1; n <= 15; n++) await Magazine.create({ ...novaRevista(n), slug: `n${n}`, editorial: 'e'.repeat(5000) });
  const res = await request(app).get('/api/home');
  assert.equal(res.status, 200);
  assert.equal(res.body.editions.length, 12);
  assert.equal(res.body.editions[0].magazine.number, 15, 'as mais recentes primeiro');
  assert.ok(res.body.editions.every((e: { magazine: object }) => !('editorial' in e.magazine)));
  assert.ok(!('editorial' in res.body.latest.data));
});
