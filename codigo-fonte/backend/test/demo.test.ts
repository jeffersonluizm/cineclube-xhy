import { test, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app';
import Magazine from '../src/models/Magazine';
import { abrirBancoEmMemoria } from './helpers/bancoEmMemoria';
import { demoLigado, restaurarDemonstracao } from '../src/lib/demo';

let banco: Awaited<ReturnType<typeof abrirBancoEmMemoria>>;

before(async () => {
  banco = await abrirBancoEmMemoria();
});
after(async () => {
  await banco?.fechar();
});
beforeEach(async () => {
  await banco.limpar();
});
afterEach(() => {
  delete process.env.DEMO_ENABLED;
});

test('modo demonstração fica desligado por padrão', () => {
  assert.equal(demoLigado({}), false);
  assert.equal(demoLigado({ DEMO_ENABLED: 'false' }), false);
  assert.equal(demoLigado({ DEMO_ENABLED: 'true' }), true);
  assert.equal(demoLigado({ DEMO_ENABLED: '1' }), true);
});

test('sem a flag, /api/demo e /api/demo/entrar não existem (404)', async () => {
  assert.equal((await request(app).get('/api/demo')).status, 404);
  assert.equal((await request(app).post('/api/demo/entrar').send({ papel: 'editor' })).status, 404);
});

test('com a flag, /api/demo descreve o papel de demonstração sem expor senha', async () => {
  process.env.DEMO_ENABLED = 'true';
  const res = await request(app).get('/api/demo');
  assert.equal(res.status, 200);
  assert.equal(res.body.ativo, true);
  assert.deepEqual(
    res.body.papeis.map((p: { papel: string }) => p.papel),
    ['editor']
  );
  assert.doesNotMatch(JSON.stringify(res.body), /senha|password/i);
});

test('com a flag, entrar como editor de demonstração devolve um token que abre o painel', async () => {
  process.env.DEMO_ENABLED = 'true';
  const entrar = await request(app).post('/api/demo/entrar').send({ papel: 'editor' });
  assert.equal(entrar.status, 200);
  assert.ok(entrar.body.token);
  const painel = await request(app).get('/api/admin/resumo').set('Authorization', `Bearer ${entrar.body.token}`);
  assert.equal(painel.status, 200);
  assert.equal((await request(app).post('/api/demo/entrar').send({ papel: 'diretor' })).status, 400);
});

test('restaurar a demonstração repõe os dados de exemplo e só popula banco vazio quando pedido', async () => {
  await restaurarDemonstracao({ soSeVazio: true, log: () => {} });
  const exemplo = await Magazine.countDocuments();
  assert.ok(exemplo >= 1);
  await Magazine.create({ number: 50, volume: 1, month: 'maio', year: 2026, slug: 'revista-50' });
  await restaurarDemonstracao({ soSeVazio: true, log: () => {} });
  assert.equal(await Magazine.countDocuments(), exemplo + 1, 'com dados, soSeVazio não mexe');
  await restaurarDemonstracao({ soSeVazio: false, log: () => {} });
  assert.equal(await Magazine.countDocuments(), exemplo, 'o reset periódico volta ao estado de exemplo');
});

test('DEMO_RESET_MINUTOS=0 desliga o reset periódico (uso local com dados próprios)', async () => {
  const { intervaloResetMinutos } = await import('../src/lib/demo');
  assert.equal(intervaloResetMinutos({}), 60);
  assert.equal(intervaloResetMinutos({ DEMO_RESET_MINUTOS: '0' }), 0);
  assert.equal(intervaloResetMinutos({ DEMO_RESET_MINUTOS: '5' }), 15, 'mínimo de 15 min');
});

test('/demo serve só as capas PNG: o script que as gera não fica público', async () => {
  assert.equal((await request(app).get('/demo/capa-revista-1.png')).status, 200);
  assert.equal((await request(app).get('/demo/gerar-capas.mjs')).status, 404);
});
