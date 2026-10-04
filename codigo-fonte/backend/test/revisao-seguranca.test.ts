// Correções pedidas pela revisão de segurança independente da branch feat/portfolio-ui-ux
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import express from 'express';
import request from 'supertest';
import { problemasDeConfiguracao } from '../src/lib/configuracao';
import { criarLimitadorGeral, criarLimitadorLoginGlobal, pedidoDoServidorDoSite } from '../src/middleware/limitadores';

const SEGREDO = 'segredo-do-site-com-mais-de-32-caracteres-123';

test('produção recusa subir com senha do editor curta ou segredos fracos', () => {
  const base = {
    NODE_ENV: 'production',
    MONGODB_URI: 'mongodb+srv://x',
    JWT_SECRET: 'j'.repeat(40),
    FRONTEND_URL: 'https://site',
    ADMIN_PASSWORD: 'senha-bem-longa-ok',
  };
  assert.deepEqual(problemasDeConfiguracao(base), []);
  assert.match(problemasDeConfiguracao({ ...base, ADMIN_PASSWORD: 'curta123' }).join(), /ADMIN_PASSWORD.*12/);
  assert.match(problemasDeConfiguracao({ ...base, JWT_SECRET: 'curto' }).join(), /JWT_SECRET.*32/);
  assert.match(problemasDeConfiguracao({ ...base, SERVIDOR_SEGREDO: 'curto' }).join(), /SERVIDOR_SEGREDO.*32/);
  assert.match(problemasDeConfiguracao({ ...base, MONGODB_URI: '' }).join(), /MONGODB_URI/);
  // fora de produção não bloqueia o desenvolvimento
  assert.deepEqual(problemasDeConfiguracao({ NODE_ENV: 'development' }), []);
});

test('o servidor do site, com o segredo certo, não cai no limite geral; sem segredo ou com segredo errado, cai', async () => {
  const mini = express();
  mini.use(criarLimitadorGeral(2, SEGREDO));
  mini.get('/', (_req, res) => res.json({ ok: true }));

  const comSegredo = [];
  for (let i = 0; i < 5; i++) comSegredo.push((await request(mini).get('/').set('X-Servidor-Site', SEGREDO)).status);
  assert.deepEqual(comSegredo, [200, 200, 200, 200, 200]);

  const errado = [];
  for (let i = 0; i < 3; i++) errado.push((await request(mini).get('/').set('X-Servidor-Site', 'chute')).status);
  assert.deepEqual(errado, [200, 200, 429]);
});

test('pedidoDoServidorDoSite compara em tempo constante e exige segredo configurado', () => {
  const req = (v?: string) => ({ headers: v ? { 'x-servidor-site': v } : {} }) as never;
  assert.equal(pedidoDoServidorDoSite(req(SEGREDO), SEGREDO), true);
  assert.equal(pedidoDoServidorDoSite(req('x'), SEGREDO), false);
  assert.equal(pedidoDoServidorDoSite(req(), SEGREDO), false);
  assert.equal(pedidoDoServidorDoSite(req(''), ''), false);
  assert.equal(pedidoDoServidorDoSite(req('qualquer'), undefined), false);
});

test('logins errados somados de todos os IPs têm teto por hora', async () => {
  const mini = express();
  mini.use(express.json());
  mini.post('/login', criarLimitadorLoginGlobal(3), (_req, res) => res.status(401).json({ error: 'Senha incorreta' }));
  const codigos = [];
  for (let i = 0; i < 4; i++) codigos.push((await request(mini).post('/login').set('X-Forwarded-For', `10.0.0.${i}`).send({})).status);
  assert.deepEqual(codigos, [401, 401, 401, 429]);
});

let pastaArquivo: string;
before(() => {
  // UPLOADS_DIR apontando para um ARQUIVO: gravar dentro dele falha (ENOTDIR/ENOENT)
  pastaArquivo = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'cineclube-falha-')), 'nao-e-pasta');
  fs.writeFileSync(pastaArquivo, 'x');
});
after(() => fs.rmSync(path.dirname(pastaArquivo), { recursive: true, force: true }));

test('falha ao gravar a imagem em disco responde 500 e não derruba o processo', async () => {
  process.env.CLOUDINARY_URL = '';
  process.env.UPLOADS_DIR = pastaArquivo;
  const { criarRotaUpload } = await import('../src/routes/upload');
  const { signToken } = await import('../src/middleware/auth');
  const mini = express();
  mini.use('/api/upload', criarRotaUpload({ pasta: pastaArquivo, usarCloudinary: false }));
  const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(32)]);
  const res = await request(mini)
    .post('/api/upload')
    .set('Authorization', `Bearer ${signToken()}`)
    .attach('image', png, { filename: 'a.png', contentType: 'image/png' });
  assert.equal(res.status, 500);
  assert.match(res.body.error, /Não foi possível guardar a imagem/);
});

test('trocar ADMIN_PASSWORD derruba os tokens emitidos com a senha antiga', async () => {
  const { signToken, requireAuth } = await import('../src/middleware/auth');
  const anterior = process.env.ADMIN_PASSWORD;
  try {
    process.env.ADMIN_PASSWORD = 'senha-antiga-do-editor';
    const token = signToken();
    const mini = express();
    mini.get('/x', requireAuth, (_req, res) => res.json({ ok: true }));
    assert.equal((await request(mini).get('/x').set('Authorization', `Bearer ${token}`)).status, 200);
    process.env.ADMIN_PASSWORD = 'senha-nova-do-editor';
    assert.equal((await request(mini).get('/x').set('Authorization', `Bearer ${token}`)).status, 401);
  } finally {
    process.env.ADMIN_PASSWORD = anterior;
  }
});
