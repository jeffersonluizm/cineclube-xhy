// Gera as tabelas e os gráficos (SVG) da carga a partir de carga/resultados/{antes,depois}/resultados.json
//   node carga/relatorio.mjs <pasta-antes> <pasta-depois>
// Saída: docs/carga/tabelas.md (incluída no relatório) e docs/carga/*.svg
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [dirAntes = 'carga/resultados/antes', dirDepois = 'carga/resultados/depois'] = process.argv.slice(2);
const ler = (d) => JSON.parse(fs.readFileSync(path.resolve(RAIZ, d, 'resultados.json'), 'utf8'));
const antes = ler(dirAntes);
const depois = ler(dirDepois);
const SAIDA = path.join(RAIZ, 'docs/carga');
fs.mkdirSync(SAIDA, { recursive: true });

// Cores validadas (scripts/validate_palette.js da skill dataviz) sobre o creme do site
const COR = { antes: '#5860AF', depois: '#C7176C', tinta: '#2B2040', suave: '#5A5070', fundo: '#F2EDD6', grade: '#D9D2B8' };

const n0 = (v) => (v == null || Number.isNaN(v) ? 'n/d' : Math.round(v).toLocaleString('pt-BR'));
const n1 = (v) => (v == null || Number.isNaN(v) ? 'n/d' : v.toLocaleString('pt-BR', { maximumFractionDigits: 1 }));
const pct = (v) => (v == null ? 'n/d' : `${(v * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`);

const ROTULOS = {
  H1: 'H1 health (sem banco)',
  'H2-1': 'H2 home, 1 revista',
  'H2-10': 'H2 home, 10 revistas',
  'H2-30': 'H2 home, 30 revistas',
  H3: 'H3 sumário da revista',
  'H4-revista': 'H4 artigo (vizinhos)',
  'H4-ciclo': 'H4 texto do ciclo',
  'H5-ciclo': 'H5 ciclo',
  'H5-filme': 'H5 filme',
  H8: 'H8 reordenar 50 textos',
  'H9-home': 'H9/H10 site: home',
  'H9-revistas': 'H9/H10 site: /revista',
  'H9-sumario': 'H9/H10 site: sumário',
  'H9-artigo': 'H9/H10 site: artigo',
  'H9-ciclo': 'H9/H10 site: ciclo',
};

function passo(res, id, vus) {
  return res.cenarios[id]?.passos?.find((p) => p.vus === vus);
}

// ---------- tabelas ----------
const linhas = [];
linhas.push('### Vazão e latência por degrau de VUs');
linhas.push('');
linhas.push('| Cenário | VUs | req/s antes | req/s depois | p50 antes | p50 depois | p95 antes | p95 depois | p99 antes | p99 depois | erros antes | erros depois |');
linhas.push('|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|');
for (const id of Object.keys(ROTULOS)) {
  const niveis = new Set([...(antes.cenarios[id]?.passos ?? []), ...(depois.cenarios[id]?.passos ?? [])].map((p) => p.vus));
  for (const vus of [...niveis].sort((a, b) => a - b)) {
    const a = passo(antes, id, vus);
    const d = passo(depois, id, vus);
    linhas.push(
      `| ${ROTULOS[id]} | ${vus} | ${n0(a?.rps)} | ${n0(d?.rps)} | ${n1(a?.p50)} | ${n1(d?.p50)} | ${n1(a?.p95)} | ${n1(d?.p95)} | ${n1(a?.p99)} | ${n1(d?.p99)} | ${pct(a?.falhas)} | ${pct(d?.falhas)} |`
    );
  }
}
linhas.push('');
linhas.push('Latências em milissegundos. "erros" = respostas com status 4xx/5xx ou sem resposta.');
linhas.push('');

linhas.push('### Consultas ao banco por requisição e tamanho da resposta');
linhas.push('');
linhas.push('| Requisição | consultas antes | consultas depois | bytes antes | bytes depois |');
linhas.push('|---|---:|---:|---:|---:|');
for (const k of Object.keys({ ...antes.consultas, ...depois.consultas })) {
  const a = antes.consultas[k];
  const d = depois.consultas[k];
  linhas.push(`| ${k} | ${a?.consultas ?? 'n/d'} | ${d?.consultas ?? 'n/d'} | ${n0(a?.bytes)} | ${n0(d?.bytes)} |`);
}
linhas.push('');
linhas.push('Consultas = variação de `opcounters.query + getmore` do MongoDB durante uma requisição já aquecida (no site, inclui `generateMetadata` e a página).');
linhas.push('');

linhas.push('### Recursos no degrau de 50 VUs (CPU em % da máquina inteira, memória em MB de pico)');
linhas.push('');
linhas.push('| Cenário | API antes | API depois | site antes | site depois | mongod antes | mongod depois |');
linhas.push('|---|---|---|---|---|---|---|');
for (const id of Object.keys(ROTULOS)) {
  const a = passo(antes, id, 50)?.recursos;
  const d = passo(depois, id, 50)?.recursos;
  if (!a && !d) continue;
  const f = (r) => (r ? `${n1(r.cpuPct)}% / ${n0(r.memMB)} MB` : 'n/d');
  linhas.push(`| ${ROTULOS[id]} | ${f(a?.api)} | ${f(d?.api)} | ${f(a?.site)} | ${f(d?.site)} | ${f(a?.mongod)} | ${f(d?.mongod)} |`);
}
linhas.push('');

const h6 = (r) => r.cenarios.H6?.passos ?? [];
linhas.push('### H6: login');
linhas.push('');
linhas.push('| Caso | 2xx antes | 4xx antes | 429 antes | req/s antes | 2xx depois | 4xx depois | 429 depois | req/s depois |');
linhas.push('|---|---:|---:|---:|---:|---:|---:|---:|---:|');
for (const tipo of ['senha certa', 'senha errada (30 tentativas seguidas)']) {
  const a = h6(antes).find((p) => p.tipo === tipo);
  const d = h6(depois).find((p) => p.tipo === tipo);
  linhas.push(`| ${tipo} | ${a?.s2xx ?? 'n/d'} | ${a?.s4xx ?? 'n/d'} | ${a?.s429 ?? 'n/d'} | ${n0(a?.rps)} | ${d?.s2xx ?? 'n/d'} | ${d?.s4xx ?? 'n/d'} | ${d?.s429 ?? 'n/d'} | ${n0(d?.rps)} |`);
}
linhas.push('');

linhas.push('### H7: 150 criações com o mesmo título');
linhas.push('');
linhas.push('| VUs | 2xx antes | 5xx antes | p95 antes | 2xx depois | 5xx depois | p95 depois |');
linhas.push('|---:|---:|---:|---:|---:|---:|---:|');
for (const vus of [1, 10]) {
  const a = antes.cenarios.H7?.passos?.find((p) => p.vus === vus);
  const d = depois.cenarios.H7?.passos?.find((p) => p.vus === vus);
  linhas.push(`| ${vus} | ${a?.s2xx ?? 'n/d'} | ${a?.s5xx ?? 'n/d'} | ${n1(a?.p95)} | ${d?.s2xx ?? 'n/d'} | ${d?.s5xx ?? 'n/d'} | ${n1(d?.p95)} |`);
}
linhas.push('');

linhas.push('### H11: site com a API fora do ar');
linhas.push('');
linhas.push('| Página | status antes | mostra antes | status depois | mostra depois |');
linhas.push('|---|---:|---|---:|---|');
const mostra = (p) => (!p ? 'n/d' : p.mostraIndisponivel ? '"serviço indisponível"' : p.mostra404 ? '404 "fim da sessão"' : p.mostraVazio ? 'lista vazia / "em breve"' : 'conteúdo');
for (const p of antes.cenarios.H11 ?? []) {
  const d = (depois.cenarios.H11 ?? []).find((x) => x.pagina === p.pagina);
  linhas.push(`| \`${p.pagina}\` | ${p.status} | ${mostra(p)} | ${d?.status ?? 'n/d'} | ${mostra(d)} |`);
}
linhas.push('');
fs.writeFileSync(path.join(SAIDA, 'tabelas.md'), linhas.join('\n'));

// ---------- gráficos ----------
// Um par de barras por cenário (antes e depois), cada linha na própria escala e com o valor
// escrito ao lado: os cenários variam de dezenas a milhares de req/s, e uma escala comum
// esconderia as linhas pequenas. A identidade não depende só da cor: há legenda e rótulos.
function graficoPareado({ arquivo, titulo, subtitulo, ids, valor, unidade, melhorMaior }) {
  const largura = 760;
  const margemEsq = 210;
  const alturaLinha = 46;
  const topo = 78;
  const altura = topo + ids.length * alturaLinha + 30;
  const largBarras = largura - margemEsq - 120;
  const partes = [];
  partes.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${largura} ${altura}" role="img" aria-labelledby="t d" font-family="Inter, system-ui, sans-serif">`);
  partes.push(`<title id="t">${titulo}</title><desc id="d">${subtitulo}</desc>`);
  partes.push(`<rect width="100%" height="100%" fill="${COR.fundo}"/>`);
  partes.push(`<text x="16" y="28" font-size="17" font-weight="700" fill="${COR.tinta}">${titulo}</text>`);
  partes.push(`<text x="16" y="48" font-size="12" fill="${COR.suave}">${subtitulo}</text>`);
  // legenda
  partes.push(`<rect x="${largura - 230}" y="58" width="12" height="12" rx="2" fill="${COR.antes}"/><text x="${largura - 213}" y="68" font-size="12" fill="${COR.tinta}">antes</text>`);
  partes.push(`<rect x="${largura - 160}" y="58" width="12" height="12" rx="2" fill="${COR.depois}"/><text x="${largura - 143}" y="68" font-size="12" fill="${COR.tinta}">depois</text>`);
  ids.forEach((id, i) => {
    const y = topo + i * alturaLinha;
    const a = valor(antes, id);
    const d = valor(depois, id);
    const max = Math.max(a ?? 0, d ?? 0) || 1;
    partes.push(`<text x="16" y="${y + 22}" font-size="12" fill="${COR.tinta}">${ROTULOS[id]}</text>`);
    partes.push(`<line x1="${margemEsq}" x2="${margemEsq}" y1="${y + 2}" y2="${y + 38}" stroke="${COR.grade}"/>`);
    [
      ['antes', a, 6],
      ['depois', d, 22],
    ].forEach(([k, v, dy]) => {
      if (v == null) return;
      const w = Math.max(2, (v / max) * largBarras);
      partes.push(`<rect x="${margemEsq}" y="${y + dy}" width="${w}" height="13" rx="3" fill="${COR[k]}"><title>${k}: ${n1(v)} ${unidade}</title></rect>`);
      partes.push(`<text x="${margemEsq + w + 6}" y="${y + dy + 11}" font-size="11" fill="${COR.tinta}">${n1(v)} ${unidade}</text>`);
    });
    if (a && d) {
      const fator = melhorMaior ? d / a : a / d;
      partes.push(`<text x="${largura - 16}" y="${y + 22}" font-size="12" font-weight="700" text-anchor="end" fill="${COR.tinta}">${fator >= 1 ? `${n1(fator)}× melhor` : `${n1(1 / fator)}× pior`}</text>`);
    }
  });
  partes.push('</svg>');
  fs.writeFileSync(path.join(SAIDA, arquivo), partes.join('\n'));
}

const ids = Object.keys(ROTULOS).filter((id) => passo(antes, id, 50) || passo(depois, id, 50));
graficoPareado({
  arquivo: '2026-10-04-vazao-50vus.svg',
  titulo: 'Vazão com 50 usuários simultâneos',
  subtitulo: 'requisições por segundo (maior é melhor); cada linha na própria escala',
  ids,
  valor: (r, id) => passo(r, id, 50)?.rps,
  unidade: 'req/s',
  melhorMaior: true,
});
graficoPareado({
  arquivo: '2026-10-04-p95-50vus.svg',
  titulo: 'Latência p95 com 50 usuários simultâneos',
  subtitulo: 'milissegundos (menor é melhor); cada linha na própria escala',
  ids,
  valor: (r, id) => passo(r, id, 50)?.p95,
  unidade: 'ms',
  melhorMaior: false,
});
console.log('tabelas e gráficos gerados em docs/carga');
