// O que o visitante do site do cliente lê não revela infraestrutura nem como a senha é guardada
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const SRC = path.resolve(__dirname, '..');
const ler = (arquivo: string) => fs.readFileSync(path.join(SRC, arquivo), 'utf8');

test('mensagens de espera e de erro não contam que o servidor é gratuito nem que dorme', () => {
  for (const arquivo of ['app/error.tsx', 'components/admin/ui.tsx', 'lib/acordando.ts']) {
    assert.doesNotMatch(ler(arquivo), /hospedagem gratuita|dorme/i, arquivo);
  }
});

test('"esqueci a senha" manda falar com a coordenação, sem nome de variável nem detalhe do servidor', () => {
  const pagina = ler('app/admin/recuperar-senha/page.tsx');
  assert.doesNotMatch(pagina, /ADMIN_PASSWORD|variável|hospedagem|reinicia/);
  assert.match(pagina, /coordenação do cineclube/);
});

test('o crédito do desenvolvedor só leva ao GitHub na demonstração de portfólio', () => {
  assert.match(ler('components/Credit.tsx'), /extrasDoPortfolio\(\)/);
});
