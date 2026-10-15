// node --test carga/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { TRAVA_PADRAO, caminhoDaTrava, adquirirTrava, liberarTrava, lerDono, travaOrfa, removerOrfa } from './trava.mjs';

const noWindows = process.platform === 'win32';

test('sem CARGA_TRAVA a trava fica na pasta temporária do sistema (nada desta máquina no código)', () => {
  assert.equal(TRAVA_PADRAO, path.join(os.tmpdir(), 'cineclube-carga-lock'));
  assert.equal(caminhoDaTrava({}), TRAVA_PADRAO);
  assert.doesNotMatch(fs.readFileSync(new URL('./trava.mjs', import.meta.url), 'utf8'), /martorelli-oficina|Faculdade/);
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

test('libera a trava num caminho com acento (o fs.rmSync do Node 24 não apagava e a trava vazava)', () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'trava-portfólio-'));
  const p = path.join(base, '.carga-lock');
  try {
    assert.equal(adquirirTrava(p), true);
    liberarTrava(p);
    assert.equal(fs.existsSync(p), false, 'a trava continuou no disco');
    liberarTrava(p); // liberar de novo não é erro
  } finally {
    if (fs.existsSync(p)) fs.rmdirSync(p);
    fs.rmdirSync(base);
  }
});

function pastaTemporaria() {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'trava-dono-'));
  return { base, p: path.join(base, '.carga-lock'), limpar: () => fs.promises.rm(base, { recursive: true, force: true }) };
}

test('a trava leva um dono.json (projeto, pid, início) no formato que os outros projetos leem', async () => {
  const { p, limpar } = pastaTemporaria();
  try {
    assert.equal(adquirirTrava(p, { projeto: 'cineclube', comando: 'rodar.mjs --rotulo depois' }), true);
    const texto = fs.readFileSync(path.join(p, 'dono.json'), 'utf8');
    assert.match(texto, /"pid": \d+,/, 'mesmo formato do com-trava.sh (sed procura "pid": N,)');
    const dono = lerDono(p);
    assert.equal(dono.projeto, 'cineclube');
    assert.equal(dono.pid, process.pid);
    assert.ok(!Number.isNaN(Date.parse(dono.inicio)));
    liberarTrava(p);
    assert.equal(fs.existsSync(p), false, 'liberar apaga o dono.json e a pasta');
  } finally {
    await limpar();
  }
});

test('órfã = dono.json com processo (e filho) mortos; sem dono.json (formato antigo) nunca é órfã', async () => {
  const { p, limpar } = pastaTemporaria();
  try {
    fs.mkdirSync(p);
    assert.equal(
      travaOrfa(p, () => false),
      false,
      'sem dono.json: só espera'
    );
    fs.writeFileSync(path.join(p, 'dono.json'), '{"projeto": "x", "pid": 111, "filho": 222, "inicio": "2026-10-15T00:00:00-03:00"}');
    assert.equal(
      travaOrfa(p, () => false),
      true
    );
    assert.equal(
      travaOrfa(p, (pid) => pid === 222),
      false,
      'filho vivo: não é órfã'
    );
    assert.equal(
      travaOrfa(p, (pid) => pid === 111),
      false,
      'dono vivo: não é órfã'
    );
    removerOrfa(p);
    assert.equal(fs.existsSync(p), false);
  } finally {
    await limpar();
  }
});

test('liberar não apaga a trava de outro dono', async () => {
  const { p, limpar } = pastaTemporaria();
  try {
    fs.mkdirSync(p);
    fs.writeFileSync(path.join(p, 'dono.json'), '{"projeto": "outro", "pid": 999999, "inicio": "2026-10-15T00:00:00-03:00"}');
    liberarTrava(p);
    assert.equal(fs.existsSync(path.join(p, 'dono.json')), true);
  } finally {
    await limpar();
  }
});

test('liberar não apaga trava cujo dono.json falta ou não pode ser lido (só apaga a sua)', async () => {
  const { p, limpar } = pastaTemporaria();
  try {
    fs.mkdirSync(p);
    liberarTrava(p);
    assert.equal(fs.existsSync(p), true, 'sem dono.json: não é desta carga');
    fs.writeFileSync(path.join(p, 'dono.json'), '{quebrado');
    liberarTrava(p);
    assert.equal(fs.existsSync(path.join(p, 'dono.json')), true, 'dono.json ilegível: não apaga');
  } finally {
    await limpar();
  }
});
