// "tentar novamente" das telas de erro precisa buscar de novo no servidor, não só redesenhar
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tentarDeNovo } from './tentarDeNovo';

test('pede os dados de novo ao servidor (refresh) e só então limpa o erro (reset), na mesma transição', () => {
  const chamadas: string[] = [];
  let dentroDaTransicao = false;
  tentarDeNovo({
    refresh: () => chamadas.push(`refresh:${dentroDaTransicao}`),
    reset: () => chamadas.push(`reset:${dentroDaTransicao}`),
    startTransition: (fn) => {
      dentroDaTransicao = true;
      fn();
      dentroDaTransicao = false;
    },
  });
  assert.deepEqual(chamadas, ['refresh:true', 'reset:true']);
});
