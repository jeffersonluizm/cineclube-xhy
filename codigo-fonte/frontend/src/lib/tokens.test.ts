import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cores, contraste, PARES_DE_TEXTO, escalaTitulos } from './tokens';

test('contraste segue a fórmula da WCAG (preto sobre branco = 21)', () => {
  assert.equal(contraste('#000000', '#FFFFFF').toFixed(0), '21');
  assert.equal(contraste('#FFFFFF', '#FFFFFF'), 1);
});

test('todo par de texto usado no site e no painel passa AA (4,5:1; 3:1 para texto grande)', () => {
  for (const par of PARES_DE_TEXTO) {
    const minimo = par.grande ? 3 : 4.5;
    const r = contraste(cores[par.texto], cores[par.fundo]);
    assert.ok(r >= minimo, `${par.texto} sobre ${par.fundo} (${par.uso}): ${r.toFixed(2)} < ${minimo}`);
  }
});

test('as cores de marca originais continuam na paleta', () => {
  assert.equal(cores.cream, '#F2EDD6');
  assert.equal(cores['dark-purple'], '#261840');
  assert.equal(cores.pink, '#E8368C');
  assert.equal(cores.olive, '#B5BB38');
  assert.equal(cores.gold, '#C8A030');
});

test('escala de títulos usa clamp com mínimo, fluido e máximo', () => {
  for (const [nome, valor] of Object.entries(escalaTitulos)) {
    assert.match(String(valor[0]), /^clamp\([\d.]+rem, [\d.]+vw, [\d.]+rem\)$/, nome);
  }
});
