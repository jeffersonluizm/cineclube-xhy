// Quantos proxies a API confia (IP real no limite por IP) e o diagnóstico que mostra quantos existem
import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import { proxiesConfiaveis, registrarSaltosDoProxy } from '../src/lib/proxy';

test('PROXIES_CONFIAVEIS: padrão 1; aceita inteiros de 0 a 5; valor inválido volta ao padrão', () => {
  assert.equal(proxiesConfiaveis({}), 1);
  assert.equal(proxiesConfiaveis({ PROXIES_CONFIAVEIS: '2' }), 2);
  assert.equal(proxiesConfiaveis({ PROXIES_CONFIAVEIS: '0' }), 0);
  for (const invalido of ['abc', '-1', '1.5', '9', 'true']) assert.equal(proxiesConfiaveis({ PROXIES_CONFIAVEIS: invalido }), 1, invalido);
});

test('o diagnóstico registra uma vez quantos endereços chegam no X-Forwarded-For, nunca os IPs', async () => {
  const linhas: string[] = [];
  const app = express();
  app.use(registrarSaltosDoProxy(2, (m) => linhas.push(m)));
  app.get('/', (_req, res) => res.send('ok'));
  await request(app).get('/').set('X-Forwarded-For', '203.0.113.9, 104.16.0.1, 10.1.2.3');
  await request(app).get('/').set('X-Forwarded-For', '198.51.100.7');
  assert.equal(linhas.length, 1);
  assert.match(linhas[0], /3 endereço/);
  assert.match(linhas[0], /PROXIES_CONFIAVEIS=2/);
  assert.doesNotMatch(linhas[0], /203\.0\.113|104\.16|10\.1\.2/);
});

test('o diagnóstico ignora pedidos sem X-Forwarded-For (o health check interno do Render) e espera um de visitante', async () => {
  const linhas: string[] = [];
  const app = express();
  app.use(registrarSaltosDoProxy(1, (m) => linhas.push(m)));
  app.get('/', (_req, res) => res.send('ok'));
  await request(app).get('/');
  assert.equal(linhas.length, 0);
  await request(app).get('/').set('X-Forwarded-For', '203.0.113.9, 104.16.0.1');
  assert.equal(linhas.length, 1);
  assert.match(linhas[0], /2 endereço/);
});
