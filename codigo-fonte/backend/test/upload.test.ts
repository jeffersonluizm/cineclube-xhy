import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import type { Express } from 'express';

let app: Express;
let token: string;

before(async () => {
  // Sem Cloudinary: o upload usaria o disco, mas o filtro recusa antes de gravar.
  // Import dinâmico para a variável valer quando upload.ts for carregado.
  process.env.CLOUDINARY_URL = '';
  app = (await import('../src/app')).default;
  token = (await import('../src/middleware/auth')).signToken();
});

const SVG = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');

test('upload recusa SVG com 400 e lista os formatos aceitos', async () => {
  const res = await request(app)
    .post('/api/upload')
    .set('Authorization', `Bearer ${token}`)
    .attach('image', SVG, { filename: 'cartaz.svg', contentType: 'image/svg+xml' });

  assert.equal(res.status, 400);
  assert.equal(res.body.error, 'Apenas imagens são permitidas (jpg, png, webp, gif, avif)');
});
