// Build de produção do site: falha cedo, com mensagem clara, quando a configuração quebraria o site
import { test } from 'node:test';
import assert from 'node:assert/strict';
const { conferirAmbienteDoBuild } = require('../../conferir-ambiente.js');

const SEGREDO = 'x'.repeat(64);

test('sem NEXT_PUBLIC_API_URL o build falha dizendo o que definir', () => {
  const { erros } = conferirAmbienteDoBuild({});
  assert.equal(erros.length, 1);
  assert.match(erros[0], /NEXT_PUBLIC_API_URL não definida.*https:\/\//);
});

test('API remota em http (sem TLS) falha; https passa', () => {
  assert.match(conferirAmbienteDoBuild({ NEXT_PUBLIC_API_URL: 'http://api.exemplo.com', SERVIDOR_SEGREDO: SEGREDO }).erros.join(), /https/);
  assert.deepEqual(conferirAmbienteDoBuild({ NEXT_PUBLIC_API_URL: 'https://api.exemplo.com', SERVIDOR_SEGREDO: SEGREDO }).erros, []);
});

test('URL inválida falha', () => {
  assert.match(conferirAmbienteDoBuild({ NEXT_PUBLIC_API_URL: 'api sem protocolo' }).erros.join(), /inválida/);
});

test('API local (localhost ou 127.0.0.1) em http é aceita: build local, CI e teste de carga', () => {
  for (const url of ['http://localhost:3001', 'http://127.0.0.1:3201']) {
    assert.deepEqual(conferirAmbienteDoBuild({ NEXT_PUBLIC_API_URL: url }).erros, [], url);
  }
});

test('API remota sem SERVIDOR_SEGREDO falha: o site cairia no limite por IP da API sob carga', () => {
  const { erros } = conferirAmbienteDoBuild({ NEXT_PUBLIC_API_URL: 'https://api.exemplo.com' });
  assert.match(erros.join(), /SERVIDOR_SEGREDO/);
  assert.match(conferirAmbienteDoBuild({ NEXT_PUBLIC_API_URL: 'https://api.exemplo.com', SERVIDOR_SEGREDO: 'curto' }).erros.join(), /32/);
});

test('API local sem SERVIDOR_SEGREDO só avisa', () => {
  const r = conferirAmbienteDoBuild({ NEXT_PUBLIC_API_URL: 'http://localhost:3001' });
  assert.deepEqual(r.erros, []);
  assert.match(r.avisos.join(), /SERVIDOR_SEGREDO/);
});
