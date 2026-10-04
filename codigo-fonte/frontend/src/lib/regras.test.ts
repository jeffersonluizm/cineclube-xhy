import { test } from 'node:test';
import assert from 'node:assert/strict';
import { expiracaoDoToken, segundosRestantes } from './sessao';
import { destinoSeguro, segundosParaTentarDeNovo } from './login';
import { agruparPorAno, filmeDaSessao } from './conteudo';

const tokenCom = (payload: object) =>
  ['eyJhbGciOiJIUzI1NiJ9', Buffer.from(JSON.stringify(payload)).toString('base64url'), 'assinatura'].join('.');

test('lê a expiração do token sem validar a assinatura (quem valida é a API)', () => {
  assert.equal(expiracaoDoToken(tokenCom({ role: 'editor', exp: 1800000000 })), 1800000000);
  assert.equal(expiracaoDoToken('lixo'), null);
  assert.equal(expiracaoDoToken(tokenCom({ role: 'editor' })), null);
});

test('segundos restantes da sessão nunca ficam negativos', () => {
  const agora = 1_700_000_000_000;
  assert.equal(segundosRestantes(tokenCom({ exp: 1_700_000_600 }), agora), 600);
  assert.equal(segundosRestantes(tokenCom({ exp: 1_699_999_000 }), agora), 0);
  assert.equal(segundosRestantes(null, agora), 0);
});

test('depois do login só volta para páginas do painel (sem redirecionamento aberto)', () => {
  assert.equal(destinoSeguro('/admin/revistas/123'), '/admin/revistas/123');
  assert.equal(destinoSeguro('/admin/ciclos?x=1'), '/admin/ciclos?x=1');
  assert.equal(destinoSeguro('https://malicioso.example/admin'), '/admin');
  assert.equal(destinoSeguro('//malicioso.example'), '/admin');
  assert.equal(destinoSeguro('/revista'), '/admin');
  assert.equal(destinoSeguro('/admin/login'), '/admin');
  assert.equal(destinoSeguro(null), '/admin');
});

test('tempo para tentar de novo vem do cabeçalho RateLimit ou do Retry-After', () => {
  assert.equal(segundosParaTentarDeNovo({ ratelimit: 'limit=10, remaining=0, reset=840', retryAfter: null }), 840);
  assert.equal(segundosParaTentarDeNovo({ ratelimit: null, retryAfter: '120' }), 120);
  assert.equal(segundosParaTentarDeNovo({ ratelimit: null, retryAfter: null }), null);
});

test('agrupa por ano, do mais recente ao mais antigo, mantendo a ordem dentro do ano', () => {
  const itens = [
    { year: 2024, t: 'a' },
    { year: 2026, t: 'b' },
    { year: 2024, t: 'c' },
  ];
  assert.deepEqual(agruparPorAno(itens), [
    [2026, [{ year: 2026, t: 'b' }]],
    [
      2024,
      [
        { year: 2024, t: 'a' },
        { year: 2024, t: 'c' },
      ],
    ],
  ]);
});

test('a sessão encontra a página do filme pelo id e, em sessões antigas, pelo slug', () => {
  const filmes = [
    { _id: 'f1', slug: 'vanda' },
    { _id: 'f2', slug: 'juventude-em-marcha' },
  ];
  assert.equal(filmeDaSessao({ filmId: 'f2', filmSlug: 'outro' }, filmes)?.slug, 'juventude-em-marcha');
  assert.equal(filmeDaSessao({ filmSlug: 'vanda' }, filmes)?.slug, 'vanda');
  assert.equal(filmeDaSessao({ filmId: 'apagado' }, filmes), undefined);
  assert.equal(filmeDaSessao({}, filmes), undefined);
});

test('slug do autor é o mesmo que a API usa na página de autor', async () => {
  const { slugAutor } = await import('./text');
  assert.equal(slugAutor('Lúcia Prado'), 'lucia-prado');
  assert.equal(slugAutor('  Agnès  Varda! '), 'agnes-varda');
  assert.equal(slugAutor('José de Alencar Jr.'), 'jose-de-alencar-jr');
});
