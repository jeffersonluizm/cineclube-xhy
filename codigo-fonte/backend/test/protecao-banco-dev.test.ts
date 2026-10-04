import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { checarBancoDev, conectarBanco, DB_PATH_PADRAO, PORTA_EMBUTIDA } from '../src/lib/banco';

const DB_TEMP = path.join(os.tmpdir(), 'cineclube-teste');

test('npm test liga a proteção do banco de desenvolvimento em todos os testes', () => {
  assert.equal(process.env.CINECLUBE_PROIBIR_BANCO_DEV, '1');
});

test('com a proteção, a porta do banco de desenvolvimento é recusada', () => {
  assert.throws(() => checarBancoDev(PORTA_EMBUTIDA, DB_TEMP, true), /banco de desenvolvimento/);
});

test('com a proteção, backend/data/db é recusado', () => {
  assert.throws(() => checarBancoDev(40000, DB_PATH_PADRAO, true), /banco de desenvolvimento/);
  assert.throws(() => checarBancoDev(40000, path.join(DB_PATH_PADRAO, '.'), true), /banco de desenvolvimento/);
});

test('porta e pasta de teste passam; sem a proteção, o padrão também passa', () => {
  assert.doesNotThrow(() => checarBancoDev(40000, DB_TEMP, true));
  assert.doesNotThrow(() => checarBancoDev(PORTA_EMBUTIDA, DB_PATH_PADRAO, false));
});

test('teste que esquece porta e pasta não cai no banco de desenvolvimento', async () => {
  const antes = fs.existsSync(DB_PATH_PADRAO) ? fs.statSync(DB_PATH_PADRAO).mtimeMs : null;

  await assert.rejects(
    conectarBanco({ uri: 'mongodb://127.0.0.1:1/x', producao: false, timeoutMs: 300, log: () => {} }),
    /banco de desenvolvimento/
  );

  const depois = fs.existsSync(DB_PATH_PADRAO) ? fs.statSync(DB_PATH_PADRAO).mtimeMs : null;
  assert.equal(depois, antes);
});
