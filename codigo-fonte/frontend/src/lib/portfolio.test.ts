// "Como foi feito" e RSS só na demonstração de portfólio: o site do cliente não expõe a arquitetura
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { extrasDoPortfolio } from './portfolio';

const SRC = path.resolve(__dirname, '..');
const ler = (arquivo: string) => fs.readFileSync(path.join(SRC, arquivo), 'utf8');

test('extras do portfólio ligados só na demonstração (NEXT_PUBLIC_DEMO)', () => {
  assert.equal(extrasDoPortfolio({}), false);
  assert.equal(extrasDoPortfolio({ NEXT_PUBLIC_DEMO: '0' }), false);
  assert.equal(extrasDoPortfolio({ NEXT_PUBLIC_DEMO: '1' }), true);
});

test('todo ponto que leva ao "como foi feito" ou ao RSS passa pela mesma regra', () => {
  const arquivos = [
    'components/Rodape.tsx',
    'app/(listas)/sobre/page.tsx',
    'app/sitemap.ts',
    'app/layout.tsx',
    'app/como-foi-feito/page.tsx',
    'app/feed.xml/route.ts',
  ];
  for (const arquivo of arquivos) assert.match(ler(arquivo), /extrasDoPortfolio\(\)/, arquivo);
});

test('no site do cliente, a página "como foi feito" e o feed respondem 404', () => {
  assert.match(ler('app/como-foi-feito/page.tsx'), /if \(!extrasDoPortfolio\(\)\) notFound\(\)/);
  assert.match(ler('app/feed.xml/route.ts'), /if \(!extrasDoPortfolio\(\)\)[\s\S]{0,80}status: 404/);
});
