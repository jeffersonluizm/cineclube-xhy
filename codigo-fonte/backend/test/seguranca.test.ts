import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app';
import { senhaConfere } from '../src/lib/senha';
import { criarLimitadorGeral } from '../src/middleware/limitadores';
import { segredoJwt, signToken, VALIDADE_TOKEN_S } from '../src/middleware/auth';
import { tipoPelosBytes } from '../src/lib/imagem';
import { linkSeguro } from '../src/lib/links';

test('origem fora da lista do CORS recebe 403 em JSON, não 500', async () => {
  const res = await request(app).get('/api/health').set('Origin', 'https://site-malicioso.example');
  assert.equal(res.status, 403);
  assert.match(res.body.error, /origem não permitida/i);
});

test('a API manda cabeçalhos de segurança e não se identifica como Express', async () => {
  const res = await request(app).get('/api/health');
  assert.equal(res.headers['x-content-type-options'], 'nosniff');
  assert.equal(res.headers['x-frame-options'], 'SAMEORIGIN');
  assert.equal(res.headers['x-powered-by'], undefined);
  assert.ok(res.headers['content-security-policy']);
});

test('rota de API inexistente responde 404 em JSON', async () => {
  const res = await request(app).get('/api/nao-existe');
  assert.equal(res.status, 404);
  assert.equal(res.body.error, 'Rota não encontrada');
});

test('JSON malformado responde 400 em JSON', async () => {
  const res = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{"password":');
  assert.equal(res.status, 400);
  assert.match(res.body.error, /JSON/);
});

test('senhaConfere compara por hash: tamanhos diferentes não saem antes', () => {
  assert.equal(senhaConfere('segredo', 'segredo'), true);
  assert.equal(senhaConfere('segredo', 'segred'), false);
  assert.equal(senhaConfere('', 'segredo'), false);
  assert.equal(senhaConfere('segredo-bem-mais-longo-que-o-outro', 'segredo'), false);
});

test('limitador geral responde 429 depois do limite por minuto e 0 desliga', async () => {
  const mini = express();
  mini.use(criarLimitadorGeral(3));
  mini.get('/', (_req, res) => res.json({ ok: true }));
  const codigos = [];
  for (let i = 0; i < 4; i++) codigos.push((await request(mini).get('/')).status);
  assert.deepEqual(codigos, [200, 200, 200, 429]);

  const livre = express();
  livre.use(criarLimitadorGeral(0));
  livre.get('/', (_req, res) => res.json({ ok: true }));
  for (let i = 0; i < 5; i++) assert.equal((await request(livre).get('/')).status, 200);
});

test('segredo de desenvolvimento só vale com banco local', () => {
  assert.equal(segredoJwt({ NODE_ENV: 'development' }), 'segredo-apenas-para-desenvolvimento');
  assert.equal(segredoJwt({ MONGODB_URI: 'mongodb://localhost:27017/x' }), 'segredo-apenas-para-desenvolvimento');
  assert.equal(segredoJwt({ MONGODB_URI: 'mongodb://127.0.0.1:27017/x' }), 'segredo-apenas-para-desenvolvimento');
  assert.throws(() => segredoJwt({ MONGODB_URI: 'mongodb+srv://u:p@cluster0.example.net/x' }), /JWT_SECRET/);
  assert.throws(() => segredoJwt({ NODE_ENV: 'production' }), /JWT_SECRET/);
  assert.equal(segredoJwt({ JWT_SECRET: 'abc', NODE_ENV: 'production' }), 'abc');
});

test('token do editor vale 8 horas', () => {
  assert.equal(VALIDADE_TOKEN_S, 8 * 3600);
  const payload = jwt.decode(signToken()) as { iat: number; exp: number };
  assert.equal(payload.exp - payload.iat, 8 * 3600);
});

test('tipo da imagem vem dos bytes, não do que o navegador declarou', () => {
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
  const jpg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const gif = Buffer.from('GIF89a\0\0\0\0\0\0');
  const webp = Buffer.concat([Buffer.from('RIFF'), Buffer.from([0, 0, 0, 0]), Buffer.from('WEBP')]);
  const avif = Buffer.concat([Buffer.from([0, 0, 0, 0x1c]), Buffer.from('ftypavif')]);
  assert.equal(tipoPelosBytes(png), 'image/png');
  assert.equal(tipoPelosBytes(jpg), 'image/jpeg');
  assert.equal(tipoPelosBytes(gif), 'image/gif');
  assert.equal(tipoPelosBytes(webp), 'image/webp');
  assert.equal(tipoPelosBytes(avif), 'image/avif');
  assert.equal(tipoPelosBytes(Buffer.from('<html><script>alert(1)</script></html>')), undefined);
});

test('links da equipe só aceitam https e mailto', () => {
  assert.equal(linkSeguro('https://instagram.com/cinexhy'), true);
  assert.equal(linkSeguro('mailto:contato@cineclube.org'), true);
  assert.equal(linkSeguro('javascript:alert(1)'), false);
  assert.equal(linkSeguro(' JavaScript:alert(1)'), false);
  assert.equal(linkSeguro('http://inseguro.example'), false);
  assert.equal(linkSeguro('data:text/html,oi'), false);
  assert.equal(linkSeguro('não é url'), false);
});

test('sessão: token válido responde quando expira; sem token responde 401', async () => {
  const ok = await request(app).get('/api/auth/sessao').set('Authorization', `Bearer ${signToken()}`);
  assert.equal(ok.status, 200);
  assert.ok(ok.body.expiraEm > Date.now() / 1000);
  assert.equal((await request(app).get('/api/auth/sessao')).status, 401);
});

test('o navegador do painel consegue ler os cabeçalhos do limite de login', async () => {
  const res = await request(app).options('/api/auth/login').set('Origin', 'http://localhost:3000').set('Access-Control-Request-Method', 'POST');
  const comum = await request(app).post('/api/auth/login').set('Origin', 'http://localhost:3000').send({ password: 'x' });
  void res;
  assert.match(String(comum.headers['access-control-expose-headers']), /RateLimit/);
  assert.match(String(comum.headers['access-control-expose-headers']), /Retry-After/);
});
