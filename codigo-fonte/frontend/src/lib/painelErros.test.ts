// Item do painel que não existe (id apagado ou malformado) vira tela de "não encontrado"
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ErroDaApi, ehNaoEncontrado } from './adminApi';

test('404 e 400 da API são "não encontrado"; falha de servidor e de rede não', () => {
  assert.equal(ehNaoEncontrado(new ErroDaApi('Revista não encontrada', 404)), true);
  assert.equal(ehNaoEncontrado(new ErroDaApi('Identificador inválido', 400)), true);
  assert.equal(ehNaoEncontrado(new ErroDaApi('Erro interno', 500)), false);
  assert.equal(ehNaoEncontrado(new Error('Failed to fetch')), false);
});
