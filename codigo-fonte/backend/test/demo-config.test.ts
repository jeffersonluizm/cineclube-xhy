// Limites da demonstração: só inteiros finitos numa faixa; fora dela a API não parte
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { limitesDaDemonstracao } from '../src/middleware/demo';

test('padrões sem nenhuma variável', () => {
  const { valores, problemas } = limitesDaDemonstracao({});
  assert.deepEqual(problemas, []);
  assert.equal(valores.DEMO_TETO_REVISTAS, 50);
  assert.equal(valores.DEMO_ESCRITAS_POR_HORA, 60);
});

test('Infinity, 1e9, fração, zero e texto são recusados (desligariam o teto)', () => {
  for (const ruim of ['Infinity', '1e9', '2.5', '0', '-3', 'muitos']) {
    const { problemas } = limitesDaDemonstracao({ DEMO_TETO_REVISTAS: ruim, DEMO_ESCRITAS_POR_HORA: ruim });
    assert.equal(problemas.length, 2, ruim);
    assert.match(problemas[0], /DEMO_TETO_REVISTAS.*inteiro entre 1 e 10000/);
  }
});

test('valor válido vale e aparece no resumo para o log', () => {
  const { valores, problemas, resumo } = limitesDaDemonstracao({ DEMO_TETO_TEXTOS: '120', DEMO_ESCRITAS_POR_HORA: '30' });
  assert.deepEqual(problemas, []);
  assert.equal(valores.DEMO_TETO_TEXTOS, 120);
  assert.match(resumo, /textos 120/);
  assert.match(resumo, /30 escritas por hora/);
});
