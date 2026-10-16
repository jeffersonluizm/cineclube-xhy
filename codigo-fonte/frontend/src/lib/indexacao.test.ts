// Site da demonstração pública fora dos buscadores (NEXT_PUBLIC_DEMO=1)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { siteDeDemonstracao, regrasRobots, robotsDaRaiz } from './indexacao';

test('a demonstração é reconhecida por NEXT_PUBLIC_DEMO', () => {
  assert.equal(siteDeDemonstracao({}), false);
  assert.equal(siteDeDemonstracao({ NEXT_PUBLIC_DEMO: '0' }), false);
  assert.equal(siteDeDemonstracao({ NEXT_PUBLIC_DEMO: '1' }), true);
  assert.equal(siteDeDemonstracao({ NEXT_PUBLIC_DEMO: 'true' }), true);
});

test('site normal: indexável, só o painel, a API e a busca ficam de fora', () => {
  assert.deepEqual(robotsDaRaiz({}), { index: true, follow: true });
  const r = regrasRobots({ NEXT_PUBLIC_SITE_URL: 'https://xhy.example' });
  assert.deepEqual(r.rules, [{ userAgent: '*', allow: '/', disallow: ['/admin', '/admin/', '/api/', '/busca'] }]);
  assert.equal(r.sitemap, 'https://xhy.example/sitemap.xml');
});

test('demonstração: noindex em todas as páginas e robots.txt bloqueando tudo, sem sitemap', () => {
  assert.deepEqual(robotsDaRaiz({ NEXT_PUBLIC_DEMO: '1' }), { index: false, follow: false });
  const r = regrasRobots({ NEXT_PUBLIC_DEMO: '1' });
  assert.deepEqual(r.rules, [{ userAgent: '*', disallow: '/' }]);
  assert.equal(r.sitemap, undefined);
});
