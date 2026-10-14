// node --test "ferramentas/*.test.mjs"
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { prepararAmbiente, lerVariavel } from './preparar-local.mjs';

function pastas() {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'preparar-local-'));
  return { base, envApi: path.join(base, 'api.env'), envSite: path.join(base, 'site.env.local') };
}
const silencioso = () => {};

test('primeira execução: os dois arquivos com o MESMO SERVIDOR_SEGREDO', () => {
  const { base, envApi, envSite } = pastas();
  try {
    prepararAmbiente({ envApi, envSite, log: silencioso });
    const api = lerVariavel(envApi, 'SERVIDOR_SEGREDO');
    assert.match(api, /^[0-9a-f]{64}$/);
    assert.equal(lerVariavel(envSite, 'SERVIDOR_SEGREDO'), api);
  } finally {
    fs.rmSync(base, { recursive: true, force: true });
  }
});

test('idempotente: rodar de novo não muda nada', () => {
  const { base, envApi, envSite } = pastas();
  try {
    prepararAmbiente({ envApi, envSite, log: silencioso });
    const antes = [fs.readFileSync(envApi, 'utf8'), fs.readFileSync(envSite, 'utf8')];
    prepararAmbiente({ envApi, envSite, log: silencioso });
    assert.deepEqual([fs.readFileSync(envApi, 'utf8'), fs.readFileSync(envSite, 'utf8')], antes);
  } finally {
    fs.rmSync(base, { recursive: true, force: true });
  }
});

test('só o site existe: a API nova herda o segredo do site', () => {
  const { base, envApi, envSite } = pastas();
  try {
    fs.writeFileSync(envSite, 'NEXT_PUBLIC_API_URL=http://localhost:3001\nSERVIDOR_SEGREDO=' + 'b'.repeat(64) + '\n');
    prepararAmbiente({ envApi, envSite, log: silencioso });
    assert.equal(lerVariavel(envApi, 'SERVIDOR_SEGREDO'), 'b'.repeat(64));
  } finally {
    fs.rmSync(base, { recursive: true, force: true });
  }
});

test('arquivos antigos sem o segredo: acrescenta a mesma linha nos dois, sem apagar o resto', () => {
  const { base, envApi, envSite } = pastas();
  try {
    fs.writeFileSync(envApi, 'PORT=3001\nADMIN_PASSWORD=minha-senha-local\n');
    fs.writeFileSync(envSite, 'NEXT_PUBLIC_API_URL=http://localhost:3001\n');
    prepararAmbiente({ envApi, envSite, log: silencioso });
    const segredo = lerVariavel(envApi, 'SERVIDOR_SEGREDO');
    assert.match(segredo, /^[0-9a-f]{64}$/);
    assert.equal(lerVariavel(envSite, 'SERVIDOR_SEGREDO'), segredo);
    assert.equal(lerVariavel(envApi, 'ADMIN_PASSWORD'), 'minha-senha-local');
  } finally {
    fs.rmSync(base, { recursive: true, force: true });
  }
});

test('segredos diferentes nos dois arquivos: não sobrescreve, avisa', () => {
  const { base, envApi, envSite } = pastas();
  const avisos = [];
  try {
    fs.writeFileSync(envApi, 'SERVIDOR_SEGREDO=' + 'a'.repeat(64) + '\n');
    fs.writeFileSync(envSite, 'SERVIDOR_SEGREDO=' + 'c'.repeat(64) + '\n');
    prepararAmbiente({ envApi, envSite, log: (m) => avisos.push(m) });
    assert.equal(lerVariavel(envApi, 'SERVIDOR_SEGREDO'), 'a'.repeat(64));
    assert.equal(lerVariavel(envSite, 'SERVIDOR_SEGREDO'), 'c'.repeat(64));
    assert.ok(avisos.some((m) => /diferente/.test(m)), avisos.join('\n'));
  } finally {
    fs.rmSync(base, { recursive: true, force: true });
  }
});
