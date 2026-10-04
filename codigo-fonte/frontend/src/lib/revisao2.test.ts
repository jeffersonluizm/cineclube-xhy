// Achados da revisão de código independente
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contaNoLimite } from './limite';
import { comChaves, semChaves } from './blocos';

test('pré-carregamento (prefetch) do Next não gasta a cota do visitante', () => {
  assert.equal(contaNoLimite(new Headers()), true);
  assert.equal(contaNoLimite(new Headers({ 'next-router-prefetch': '1' })), false);
  assert.equal(contaNoLimite(new Headers({ purpose: 'prefetch' })), false);
  assert.equal(contaNoLimite(new Headers({ 'x-middleware-prefetch': '1' })), false);
});

test('blocos ganham chave estável no editor e saem sem ela para a API', () => {
  const blocos = comChaves([
    { type: 'paragraph', text: 'a' },
    { type: 'image', src: '/x.png' },
  ]);
  assert.ok(blocos.every((b) => typeof b._k === 'string' && b._k.length > 0));
  assert.notEqual(blocos[0]._k, blocos[1]._k);
  const mesmo = comChaves(blocos);
  assert.equal(mesmo[0]._k, blocos[0]._k, 'chave existente é mantida');
  assert.deepEqual(semChaves(blocos), [
    { type: 'paragraph', text: 'a' },
    { type: 'image', src: '/x.png' },
  ]);
});
