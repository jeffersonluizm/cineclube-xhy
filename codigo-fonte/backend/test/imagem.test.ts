import { test } from 'node:test';
import assert from 'node:assert/strict';
import { uploadFileName } from '../src/lib/imagem.ts';

test('nome gravado usa base higienizada e a extensão do tipo da imagem', () => {
  assert.equal(uploadFileName('Cartaz Ação.JPG', 'image/jpeg', 1700000000000), '1700000000000-cartaz-acao.jpg');
});

test('extensão vem do tipo validado, não do nome enviado (evita servir .html como imagem)', () => {
  assert.equal(uploadFileName('ataque.html', 'image/png', 1), '1-ataque.png');
});

test('arquivo sem extensão recebe a do tipo', () => {
  assert.equal(uploadFileName('poster', 'image/webp', 1), '1-poster.webp');
});
