import { test } from 'node:test';
import assert from 'node:assert/strict';
import { montarRss } from './rss';

const texto = {
  _id: '1',
  title: 'Akerman & o tempo <ensaio>',
  slug: 'akerman',
  author: 'Lúcia Prado',
  column: 'crítica',
  parentType: 'revista' as const,
  href: '/revista/3/artigo/akerman',
  trecho: 'Jeanne "Dielman" e a cozinha',
  createdAt: '2026-05-01T12:00:00.000Z',
};

test('RSS 2.0 com link absoluto, autor e data no formato RFC 822', () => {
  const xml = montarRss([texto], 'https://cinexhy.example');
  assert.match(xml, /^<\?xml version="1.0" encoding="UTF-8"\?>/);
  assert.match(xml, /<rss version="2.0"/);
  assert.match(xml, /<link>https:\/\/cinexhy.example\/revista\/3\/artigo\/akerman<\/link>/);
  assert.match(xml, /<pubDate>Fri, 01 May 2026 12:00:00 GMT<\/pubDate>/);
  assert.match(xml, /<dc:creator>Lúcia Prado<\/dc:creator>/);
});

test('RSS escapa caracteres especiais do XML', () => {
  const xml = montarRss([texto], 'https://cinexhy.example');
  assert.match(xml, /<title>Akerman &amp; o tempo &lt;ensaio&gt;<\/title>/);
  assert.match(xml, /Jeanne &quot;Dielman&quot; e a cozinha/);
  assert.doesNotMatch(xml, /<ensaio>/);
});
