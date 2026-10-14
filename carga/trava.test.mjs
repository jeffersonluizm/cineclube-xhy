// node --test carga/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { TRAVA_PADRAO, caminhoDaTrava, adquirirTrava, liberarTrava } from './trava.mjs';

const noWindows = process.platform === 'win32';

test('o caminho padrão da trava é absoluto e mantém as barras invertidas', { skip: !noWindows }, () => {
  assert.ok(path.isAbsolute(TRAVA_PADRAO), TRAVA_PADRAO);
  assert.ok(TRAVA_PADRAO.endsWith('\\martorelli-oficina\\.carga-lock'), TRAVA_PADRAO);
  assert.equal(caminhoDaTrava({}), TRAVA_PADRAO);
});

test('recusa trava relativa', () => {
  assert.throws(() => caminhoDaTrava({ CARGA_TRAVA: '.carga-lock' }), /absolut/);
});

test('recusa o caminho que o bug gerava (unidade sem barra, relativo ao diretório da unidade)', { skip: !noWindows }, () => {
  assert.throws(
    () => caminhoDaTrava({ CARGA_TRAVA: 'E:FaculdadeProjeto - FaculdadeProjetos do portfóliomartorelli-oficina.carga-lock' }),
    /absolut/
  );
});

test('aceita trava absoluta vinda do ambiente', () => {
  const p = path.join(os.tmpdir(), 'trava-qualquer');
  assert.equal(caminhoDaTrava({ CARGA_TRAVA: p }), p);
});

test('adquire uma vez, recusa a segunda e libera', () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'trava-'));
  const p = path.join(base, '.carga-lock');
  try {
    assert.equal(adquirirTrava(p), true);
    assert.equal(adquirirTrava(p), false);
    liberarTrava(p);
    assert.equal(fs.existsSync(p), false);
    assert.equal(adquirirTrava(p), true);
    liberarTrava(p);
  } finally {
    fs.rmSync(base, { recursive: true, force: true });
  }
});

test('não cria pastas no caminho: se a pasta da oficina não existe, falha em vez de fingir que travou', () => {
  const p = path.join(os.tmpdir(), 'nao-existe-' + process.pid, 'sub', '.carga-lock');
  assert.throws(() => adquirirTrava(p), /ENOENT/);
});
