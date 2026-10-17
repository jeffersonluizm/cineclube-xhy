// Blueprint da produção (render.producao.yaml): tudo o que a API exige em produção, sem demonstração
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { problemasDeConfiguracao } from '../src/lib/configuracao';
import { demoLigado } from '../src/lib/demoFlag';

const RAIZ = path.resolve(__dirname, '../../..');
const ler = (nome: string) => fs.readFileSync(path.join(RAIZ, nome), 'utf8');

/** Variáveis do Blueprint: { chave: valor fixo | 'sync:false' | 'generateValue' } */
function variaveis(yaml: string): Record<string, string> {
  const resultado: Record<string, string> = {};
  const linhas = yaml.split(/\r?\n/);
  for (let i = 0; i < linhas.length; i++) {
    const chave = linhas[i].match(/^\s+- key: (\S+)/)?.[1];
    if (!chave) continue;
    const seguinte = linhas[i + 1] ?? '';
    const valor = seguinte.match(/^\s+value: "?([^"#]*?)"?\s*(#.*)?$/)?.[1];
    if (valor !== undefined) resultado[chave] = valor.trim();
    else if (/sync: false/.test(seguinte)) resultado[chave] = 'sync:false';
    else if (/generateValue: true/.test(seguinte)) resultado[chave] = 'generateValue';
  }
  return resultado;
}

const producao = variaveis(ler('render.producao.yaml'));

test('serviço de produção: nome, runtime, plano, região e o mesmo build, start e health check da demonstração', () => {
  const yaml = ler('render.producao.yaml');
  const demo = ler('render.yaml');
  assert.match(yaml, /name: cineclubexhy-api\b/);
  assert.match(yaml, /runtime: node\b/);
  assert.match(yaml, /plan: free\b/);
  assert.match(yaml, /region: oregon\b/);
  for (const campo of ['rootDir', 'buildCommand', 'startCommand', 'healthCheckPath']) {
    const doYaml = (texto: string) => texto.match(new RegExp(`^\\s+${campo}: (.+?)\\s*(#.*)?$`, 'm'))?.[1];
    assert.equal(doYaml(yaml), doYaml(demo), campo);
  }
});

test('sem demonstração: DEMO_ENABLED e DEMO_RESET_MINUTOS ausentes', () => {
  assert.equal(Object.keys(producao).filter((k) => k.startsWith('DEMO_')).length, 0);
  assert.equal(demoLigado(producao), false);
});

test('segredos ficam no painel (sync: false) e o JWT é gerado pelo Render', () => {
  for (const k of ['MONGODB_URI', 'ADMIN_PASSWORD', 'SERVIDOR_SEGREDO', 'FRONTEND_URL', 'CLOUDINARY_URL']) {
    assert.equal(producao[k], 'sync:false', k);
  }
  assert.equal(producao.JWT_SECRET, 'generateValue');
  assert.equal(producao.NODE_ENV, 'production');
  assert.equal(producao.CLOUDINARY_FOLDER, 'cineclube-xhy');
  assert.equal(producao.MONGODB_TIMEOUT_MS, '30000');
});

test('com os segredos preenchidos, a API aceita a configuração de produção (nenhuma obrigatória faltando)', () => {
  const preenchido: NodeJS.ProcessEnv = {};
  for (const [k, v] of Object.entries(producao)) {
    preenchido[k] = v === 'sync:false' || v === 'generateValue' ? 'x'.repeat(64) : v;
  }
  assert.deepEqual(problemasDeConfiguracao(preenchido), []);
});
