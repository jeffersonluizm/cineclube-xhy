// Correções da revisão de segurança no front
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { primeiroValor } from './text';
import { tokenPareceValido, apagarRascunhos } from './sessao';
import { criarLimitador } from './limite';

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

test('limitador por IP do site: janela de um minuto por chave', () => {
  const limitar = criarLimitador({ limite: 2, janelaMs: 60_000 });
  const t0 = 1_000_000;
  assert.equal(limitar('1.1.1.1', t0), true);
  assert.equal(limitar('1.1.1.1', t0 + 1), true);
  assert.equal(limitar('1.1.1.1', t0 + 2), false);
  assert.equal(limitar('2.2.2.2', t0 + 3), true, 'outro IP tem a própria cota');
  assert.equal(limitar('1.1.1.1', t0 + 60_001), true, 'a janela renova');
});
