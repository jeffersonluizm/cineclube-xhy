import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import type { Express } from 'express';

let app: Express;
let token: string;
let pasta: string;

before(async () => {
  // Sem Cloudinary: o upload grava em disco, numa pasta temporária só deste teste.
  // Import dinâmico para as variáveis valerem quando upload.ts for carregado.
  process.env.CLOUDINARY_URL = '';
  pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'cineclube-upload-'));
  process.env.UPLOADS_DIR = pasta;
  app = (await import('../src/app')).default;
  token = (await import('../src/middleware/auth')).signToken();
});

after(() => {
  fs.rmSync(pasta, { recursive: true, force: true });
});

const SVG = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(32)]);

test('upload recusa SVG com 400 e lista os formatos aceitos', async () => {
  const res = await request(app)
    .post('/api/upload')
    .set('Authorization', `Bearer ${token}`)
    .attach('image', SVG, { filename: 'cartaz.svg', contentType: 'image/svg+xml' });

  assert.equal(res.status, 400);
  assert.equal(res.body.error, 'Apenas imagens são permitidas (jpg, png, webp, gif, avif)');
});

test('upload recusa HTML disfarçado de PNG pelos bytes do arquivo', async () => {
  const res = await request(app)
    .post('/api/upload')
    .set('Authorization', `Bearer ${token}`)
    .attach('image', Buffer.from('<html><script>alert(1)</script></html>'), { filename: 'foto.png', contentType: 'image/png' });

  assert.equal(res.status, 400);
  assert.match(res.body.error, /não é uma imagem válida/);
  assert.equal(fs.readdirSync(pasta).length, 0, 'nada pode ser gravado em disco');
});

test('upload de PNG verdadeiro grava com a extensão do tipo real e devolve a URL', async () => {
  const res = await request(app)
    .post('/api/upload')
    .set('Authorization', `Bearer ${token}`)
    .attach('image', PNG, { filename: 'Cartaz Novo.jpg', contentType: 'image/jpeg' });

  assert.equal(res.status, 200);
  assert.match(res.body.url, /^\/uploads\/\d+-cartaz-novo\.png$/);
  assert.ok(fs.existsSync(path.join(pasta, path.basename(res.body.url))));
});

test('upload sem token responde 401', async () => {
  const res = await request(app).post('/api/upload').attach('image', PNG, { filename: 'a.png', contentType: 'image/png' });
  assert.equal(res.status, 401);
});
