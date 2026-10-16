// Como o cliente da API das páginas públicas classifica as respostas
import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { api, ouNulo, ErroApi, ErroNaoEncontrado } from './api';

const fetchOriginal = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = fetchOriginal;
});
const responder = (status: number, corpo: unknown = {}) => {
  globalThis.fetch = (async () => new Response(JSON.stringify(corpo), { status })) as typeof fetch;
};

test('endereço malformado (/revista/abc → API 400) é "não encontrado", não "serviço indisponível"', async () => {
  responder(400, { error: 'Número inválido' });
  await assert.rejects(api.revista.get('abc'), ErroNaoEncontrado);
  assert.equal(await ouNulo(api.revista.get('abc')), null);
});

test('404 continua "não encontrado"', async () => {
  responder(404);
  assert.equal(await ouNulo(api.autor('ninguem')), null);
});

test('5xx e falha de rede continuam ErroApi (não viram 404 falso)', async () => {
  responder(503);
  await assert.rejects(ouNulo(api.revista.get('1')), ErroApi);
  globalThis.fetch = (async () => {
    throw new TypeError('fetch failed');
  }) as typeof fetch;
  await assert.rejects(ouNulo(api.revista.get('1')), ErroApi);
});
