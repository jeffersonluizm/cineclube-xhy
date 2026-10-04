import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extensaoDaImagem, uploadFileName } from '../src/lib/imagem.ts';

test('nome gravado usa base higienizada e a extensão do tipo da imagem', () => {
  assert.equal(uploadFileName('Cartaz Ação.JPG', 'image/jpeg', 1700000000000), '1700000000000-cartaz-acao.jpg');
});

test('extensão vem do tipo validado, não do nome enviado (evita servir .html como imagem)', () => {
  assert.equal(uploadFileName('ataque.html', 'image/png', 1), '1-ataque.png');
});

test('arquivo sem extensão recebe a do tipo', () => {
  assert.equal(uploadFileName('poster', 'image/webp', 1), '1-poster.webp');
});

test('só os tipos da tabela são aceitos, não chaves herdadas de Object.prototype', () => {
  for (const tipo of ['constructor', '__proto__', 'toString', 'text/html', 'image/heic']) {
    assert.equal(extensaoDaImagem(tipo), undefined, tipo);
  }
  assert.equal(extensaoDaImagem('image/svg+xml'), '.svg');
});
