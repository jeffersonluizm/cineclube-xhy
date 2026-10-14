// Blocos do editor de textos
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { comChaves, semChaves } from './blocos';

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
