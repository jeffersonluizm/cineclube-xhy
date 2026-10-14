// Segurança do site: parâmetros da URL, token da revalidação e rascunhos do editor
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { primeiroValor } from './text';
import { tokenPareceValido, apagarRascunhos } from './sessao';

const tokenCom = (payload: object) =>
  ['eyJhbGciOiJIUzI1NiJ9', Buffer.from(JSON.stringify(payload)).toString('base64url'), 'assinatura'].join('.');

test('parâmetro repetido na URL (?q=a&q=b) vira um valor só', () => {
  assert.equal(primeiroValor('tati'), 'tati');
  assert.equal(primeiroValor(['a', 'b']), 'a');
  assert.equal(primeiroValor(undefined), '');
  assert.equal(primeiroValor([]), '');
});

test('revalidar só aceita algo com formato de JWT e ainda não expirado', () => {
  const agora = 1_700_000_000_000;
  assert.equal(tokenPareceValido(tokenCom({ exp: 1_700_000_600 }), agora), true);
  assert.equal(tokenPareceValido(tokenCom({ exp: 1_699_999_000 }), agora), false);
  assert.equal(tokenPareceValido('qualquer-coisa', agora), false);
  assert.equal(tokenPareceValido('', agora), false);
});

test('sair apaga os rascunhos locais do editor e mais nada', () => {
  const dados = new Map<string, string>([
    ['xhy_rascunho:texto:1', '{}'],
    ['xhy_rascunho:novo:revista:2', '{}'],
    ['outra-chave', 'fica'],
  ]);
  const armazenamento = {
    get length() {
      return dados.size;
    },
    key: (i: number) => Array.from(dados.keys())[i] ?? null,
    removeItem: (k: string) => void dados.delete(k),
  };
  apagarRascunhos(armazenamento);
  assert.deepEqual(Array.from(dados.keys()), ['outra-chave']);
});
