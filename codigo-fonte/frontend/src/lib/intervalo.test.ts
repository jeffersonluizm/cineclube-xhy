// Intervalo do reset mostrado no cartão da demonstração (antes: 15 min virava "1 h")
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { intervaloEmTexto } from './intervalo';

test('minutos em texto legível, sem arredondar para horas', () => {
  assert.equal(intervaloEmTexto(15), '15 min');
  assert.equal(intervaloEmTexto(60), '1 h');
  assert.equal(intervaloEmTexto(90), '1 h 30 min');
  assert.equal(intervaloEmTexto(360), '6 h');
});
