// Proteções da demonstração pública: upload contido, reset de 60 min e banco só de demonstração
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import express from 'express';
import request from 'supertest';
import { criarRotaUpload, LIMITE_UPLOAD_DEMO_MB, ENVIOS_DEMO_POR_HORA } from '../src/routes/upload';
import { signToken } from '../src/middleware/auth';
import { bancoAceitaDemonstracao, intervaloResetMinutos, limparUploadsDemonstracao } from '../src/lib/demo';
import { imagemSegura } from '../src/lib/links';

let pasta: string;
before(() => {
  pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'cineclube-demo-upload-'));
});
after(() => {
  fs.rmSync(pasta, { recursive: true, force: true });
});

const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(32)]);
const appDemo = () => express().use('/api/upload', criarRotaUpload({ pasta, usarCloudinary: false, demo: true }));
const enviar = (app: express.Express, arquivo = PNG) =>
  request(app)
    .post('/api/upload')
    .set('Authorization', `Bearer ${signToken()}`)
    .attach('image', arquivo, { filename: 'cartaz.png', contentType: 'image/png' });

test('na demonstração o upload grava numa pasta própria (apagada no reset)', async () => {
  const res = await enviar(appDemo());
  assert.equal(res.status, 200);
  assert.match(res.body.url, /^\/uploads\/demo\/\d+-cartaz\.png$/);
  assert.ok(fs.existsSync(path.join(pasta, 'demo', path.basename(res.body.url))));
  assert.equal(imagemSegura(res.body.url), true, 'a URL devolvida é aceita no conteúdo');
});

test(`na demonstração a imagem passa de ${LIMITE_UPLOAD_DEMO_MB} MB → 413 com mensagem em português`, async () => {
  const grande = Buffer.concat([PNG, Buffer.alloc(LIMITE_UPLOAD_DEMO_MB * 1024 * 1024)]);
  const res = await enviar(appDemo(), grande);
  assert.equal(res.status, 413);
  assert.equal(res.body.error, `A imagem passa do limite de ${LIMITE_UPLOAD_DEMO_MB} MB.`);
});

test(`na demonstração cada IP envia no máximo ${ENVIOS_DEMO_POR_HORA} imagens por hora`, async () => {
  const app = appDemo();
  for (let i = 0; i < ENVIOS_DEMO_POR_HORA; i++) assert.equal((await enviar(app)).status, 200);
  const res = await enviar(app);
  assert.equal(res.status, 429);
  assert.match(res.body.error, /demonstração/);
});

test('o reset da demonstração apaga só a pasta de uploads da demonstração', () => {
  fs.mkdirSync(path.join(pasta, 'demo'), { recursive: true });
  fs.writeFileSync(path.join(pasta, 'demo', 'x.png'), PNG);
  fs.writeFileSync(path.join(pasta, 'do-editor.png'), PNG);
  limparUploadsDemonstracao(pasta);
  assert.equal(fs.existsSync(path.join(pasta, 'demo')), false);
  assert.equal(fs.existsSync(path.join(pasta, 'do-editor.png')), true);
});

test('reset da demonstração: 60 min por padrão', () => {
  assert.equal(intervaloResetMinutos({}), 60);
});

test('com DEMO_ENABLED, o banco precisa ter "demo" no nome (o reset apaga tudo)', () => {
  assert.equal(bancoAceitaDemonstracao('cineclube_demo', { NODE_ENV: 'production' }), null);
  assert.equal(bancoAceitaDemonstracao('Demo-Cineclube', {}), null);
  assert.match(bancoAceitaDemonstracao('cineclube_xhy', { NODE_ENV: 'production' }) ?? '', /demo/);
  assert.match(bancoAceitaDemonstracao('test', {}) ?? '', /demo/, 'URI sem nome de banco cai no "test"');
});

test('exceção local: o banco de desenvolvimento serve à demonstração só com o reset desligado e fora de produção', () => {
  assert.equal(bancoAceitaDemonstracao('cineclube_xhy', { DEMO_RESET_MINUTOS: '0' }), null);
  assert.notEqual(bancoAceitaDemonstracao('cineclube_xhy', { DEMO_RESET_MINUTOS: '0', NODE_ENV: 'production' }), null);
});
