// Partida da demonstração: erro transitório do banco (Atlas acordando) não derruba a API de primeira
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { comTentativas } from '../src/lib/tentativas';

test('tenta de novo até dar certo, avisando cada falha', async () => {
  let vezes = 0;
  const avisos: string[] = [];
  const r = await comTentativas(
    async () => {
      vezes++;
      if (vezes < 3) throw new Error('transitório');
      return 'ok';
    },
    { tentativas: 3, esperaMs: 1, rotulo: 'preparar a demonstração', log: (m) => avisos.push(m) }
  );
  assert.equal(r, 'ok');
  assert.equal(vezes, 3);
  assert.equal(avisos.length, 2);
  assert.match(avisos[0], /preparar a demonstração.*tentativa 1 de 3.*transitório/);
});

test('esgotadas as tentativas, o último erro sobe', async () => {
  await assert.rejects(
    comTentativas(async () => Promise.reject(new Error('fora do ar')), { tentativas: 2, esperaMs: 1, rotulo: 'x', log: () => {} }),
    /fora do ar/
  );
});
