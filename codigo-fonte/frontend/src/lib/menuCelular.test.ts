// Qual link do menu do celular marca a página atual
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { linkAtivo } from './menuCelular';

test('link ativo na própria página e nas páginas dentro dele', () => {
  assert.equal(linkAtivo({ href: '/ciclos-mostras', rotulo: 'exibições' }, '/ciclos-mostras'), true);
  assert.equal(linkAtivo({ href: '/ciclos-mostras', rotulo: 'exibições' }, '/ciclos-mostras/ran/texto/x'), true);
  assert.equal(linkAtivo({ href: '/revista', rotulo: 'revista' }, '/revistas-antigas'), false);
});

test('"exato" marca só a própria página (o início do painel não fica ativo em todo /admin)', () => {
  assert.equal(linkAtivo({ href: '/admin', rotulo: 'início', exato: true }, '/admin'), true);
  assert.equal(linkAtivo({ href: '/admin', rotulo: 'início', exato: true }, '/admin/ciclos'), false);
});

test('"tambem" marca o link em outras áreas que pertencem a ele', () => {
  const revistas = { href: '/admin/revistas', rotulo: 'revistas', tambem: ['/admin/artigos'] };
  assert.equal(linkAtivo(revistas, '/admin/artigos/123'), true);
  assert.equal(linkAtivo(revistas, '/admin/ciclos'), false);
});

test('link externo nunca fica ativo', () => {
  assert.equal(linkAtivo({ href: '/', rotulo: 'ver o site ↗', externo: true }, '/'), false);
});
