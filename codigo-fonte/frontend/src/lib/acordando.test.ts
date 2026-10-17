// O aviso de servidor acordando aparece no login do site real também: não pode falar em demonstração
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MENSAGEM_ACORDANDO } from './acordando';

test('aviso de servidor acordando serve para produção e demonstração', () => {
  assert.doesNotMatch(MENSAGEM_ACORDANDO, /demonstra/i);
  assert.match(MENSAGEM_ACORDANDO, /um minuto/);
});
