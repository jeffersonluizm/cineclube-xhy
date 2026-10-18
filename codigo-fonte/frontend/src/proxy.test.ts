// Limite por IP do visitante no site (proxy, o antigo middleware). Os testes chamam o proxy de
// verdade, sem confiar em cabeçalho de prefetch: RSC, Next-Router-Prefetch e Purpose: prefetch
// quem manda é o cliente, então nenhum deles isenta da contagem.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { proxy } from './proxy';
import { criarLimitador, cotaDaRota, COTAS, paginaDeLimite } from './lib/limite';

let ipSeq = 0;
const novoIp = () => `10.0.${Math.floor(++ipSeq / 250)}.${ipSeq % 250}`;
const pedido = (url: string, ip: string, cabecalhos: Record<string, string> = {}) =>
  new NextRequest(new URL(url, 'http://localhost:3000'), { headers: { 'x-forwarded-for': ip, ...cabecalhos } });

function contar429(url: string, vezes: number, ip: string, cabecalhos: Record<string, string> = {}) {
  let bloqueados = 0;
  for (let i = 0; i < vezes; i++) {
    const r = proxy(pedido(url, ip, cabecalhos));
    if (r.status === 429) bloqueados++;
  }
  return bloqueados;
}

test('limitador por IP do site: janela de um minuto por chave', () => {
  const limitar = criarLimitador({ limite: 2, janelaMs: 60_000 });
  const t0 = 1_000_000;
  assert.equal(limitar('1.1.1.1', t0), true);
  assert.equal(limitar('1.1.1.1', t0 + 1), true);
  assert.equal(limitar('1.1.1.1', t0 + 2), false);
  assert.equal(limitar('2.2.2.2', t0 + 3), true, 'outro IP tem a própria cota');
  assert.equal(limitar('1.1.1.1', t0 + 60_001), true, 'a janela renova');
});

test('a cota de busca vale só quando há termo (?q); a página vazia da busca é página comum', () => {
  assert.equal(cotaDaRota('/busca', new URLSearchParams('q=tempo')), 'busca');
  assert.equal(cotaDaRota('/busca', new URLSearchParams('')), 'paginas');
  assert.equal(cotaDaRota('/api/revalidar', new URLSearchParams('')), 'revalidar');
  assert.equal(cotaDaRota('/revista/1', new URLSearchParams('q=x')), 'paginas');
});

test('Purpose: prefetch NÃO isenta a busca: o 21º termo no minuto recebe 429', () => {
  const ip = novoIp();
  const bloqueados = contar429('/busca?q=abuso', 30, ip, { purpose: 'prefetch' });
  assert.equal(bloqueados, 30 - COTAS.busca.limite);
});

test('cabeçalhos de prefetch do Next também não isentam (o proxy não deve confiar neles)', () => {
  const ip = novoIp();
  const bloqueados = contar429('/busca?q=x', COTAS.busca.limite + 5, ip, {
    'next-router-prefetch': '1',
    'x-middleware-prefetch': '1',
    rsc: '1',
  });
  assert.equal(bloqueados, 5);
});

test('abrir /busca sem termo não gasta a cota de busca', () => {
  const ip = novoIp();
  assert.equal(contar429('/busca', COTAS.busca.limite * 2, ip), 0);
  assert.equal(contar429('/busca?q=ok', 1, ip), 0, 'a cota de busca continua inteira');
});

test('cota de páginas comporta visitas reais: cada visita gasta cerca de 9,2 requisições no Next 16 (documento + prefetch)', () => {
  assert.ok(COTAS.paginas.limite >= 9.2 * 60, 'pelo menos 60 visitas por minuto');
  const ip = novoIp();
  assert.equal(contar429('/revista', COTAS.paginas.limite, ip), 0);
  assert.equal(contar429('/revista', 1, ip), 1);
});

test('429 de página volta em HTML com a identidade do site e Retry-After', async () => {
  const ip = novoIp();
  contar429('/busca?q=a', COTAS.busca.limite, ip);
  const r = proxy(pedido('/busca?q=a', ip));
  assert.equal(r.status, 429);
  assert.equal(r.headers.get('retry-after'), '60');
  assert.match(r.headers.get('content-type') ?? '', /text\/html/);
  const html = await r.text();
  assert.match(html, /<html lang="pt-BR">/);
  assert.match(html, /Aguarde um minuto/);
  assert.match(html, /#F2EDD6/i, 'fundo creme do site');
  assert.doesNotMatch(html, /—/, 'sem travessão no texto ao visitante');
  assert.equal(html, paginaDeLimite());
});

test('429 da revalidação continua em JSON', async () => {
  const ip = novoIp();
  contar429('/api/revalidar', COTAS.revalidar.limite, ip);
  const r = proxy(pedido('/api/revalidar', ip));
  assert.equal(r.status, 429);
  assert.match(r.headers.get('content-type') ?? '', /application\/json/);
});

test('sem X-Forwarded-For o pedido ainda é contado (balde "desconhecido"), sem quebrar o proxy', () => {
  // o Next 15 tirou o req.ip: o IP vem só do X-Forwarded-For
  const semIp = () => proxy(new NextRequest(new URL('/busca?q=sem-ip', 'http://localhost:3000')));
  let bloqueados = 0;
  for (let i = 0; i < COTAS.busca.limite + 3; i++) if (semIp().status === 429) bloqueados++;
  assert.equal(bloqueados, 3);
});
