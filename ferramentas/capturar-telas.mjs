// Tira os prints do README com o Chrome instalado (headless, via playwright-core).
//   node ferramentas/capturar-telas.mjs http://localhost:3000 [somente,lista,de,nomes]
// Precisa do site e da API rodando com o modo demonstração ligado (iniciar.bat já liga).
// Também confere o que dá para conferir automaticamente: status das páginas, rolagem
// horizontal a 375 px e erros no console.
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = createRequire(path.join(raiz, 'codigo-fonte/frontend/package.json'))('playwright-core');
const BASE = (process.argv[2] || 'http://localhost:3000').replace(/\/$/, '');
const SO = process.argv[3]?.split(',');
const DESTINO = path.join(raiz, 'docs/img');
const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const DESKTOP = { width: 1280, height: 800 };
const CELULAR = { width: 375, height: 812 };

const telas = [
  { nome: '01-home', url: '/', tela: DESKTOP },
  { nome: '02-sumario-revista', url: '/revista/1', tela: DESKTOP },
  { nome: '03-leitura', url: '/revista/1/artigo/como-filmar-os-proprios-fantasmas', tela: DESKTOP },
  { nome: '04-exibicao', url: '/ciclos-mostras/o-tempo-do-depois', tela: DESKTOP, rolar: 360 },
  { nome: '05-busca', url: '/busca?q=tempo', tela: DESKTOP },
  { nome: '06-404', url: '/revista/999', tela: DESKTOP, status: 404 },
  { nome: '12-celular-leitura', url: '/revista/1/artigo/como-filmar-os-proprios-fantasmas', tela: CELULAR },
  { nome: '13-celular-home', url: '/', tela: CELULAR },
  { nome: '14-como-foi-feito', url: '/como-foi-feito#carga', tela: DESKTOP },
  { nome: '15-login-demonstracao', url: '/admin/login', tela: DESKTOP, esperar: 'text=Explore a demonstração' },
];

fs.mkdirSync(DESTINO, { recursive: true });
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const problemas = [];
try {
  for (const t of telas.filter((x) => !SO || SO.includes(x.nome))) {
    const ctx = await browser.newContext({ viewport: t.tela, deviceScaleFactor: 1, locale: 'pt-BR' });
    const page = await ctx.newPage();
    const erros = [];
    page.on('console', (m) => {
      if (m.type() !== 'error') return;
      // Na página 404 o próprio navegador registra o status da página como erro: é o esperado.
      if (t.status === 404 && /status of 404/.test(m.text())) return;
      erros.push(m.text());
    });
    const resp = await page.goto(BASE + t.url, { waitUntil: 'networkidle', timeout: 120_000 });
    if (t.esperar) await page.waitForSelector(t.esperar, { timeout: 60_000 });
    if (t.rolar) await page.evaluate((y) => window.scrollTo(0, y), t.rolar);
    await page.waitForTimeout(800);
    const status = resp?.status() ?? 0;
    if (status !== (t.status ?? 200)) problemas.push(`${t.nome}: status ${status}`);
    const estoura = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    if (estoura) problemas.push(`${t.nome}: rolagem horizontal em ${t.tela.width}px`);
    if (erros.length) problemas.push(`${t.nome}: console: ${erros.join(' | ').slice(0, 200)}`);
    await page.screenshot({ path: path.join(DESTINO, `${t.nome}.jpg`), type: 'jpeg', quality: 82 });
    console.log(`[ok] ${t.nome} (${status})`);
    await ctx.close();
  }
} finally {
  await browser.close();
}
if (problemas.length) {
  console.log('\nProblemas encontrados:\n- ' + problemas.join('\n- '));
  process.exitCode = 1;
} else {
  console.log('\nTodas as telas abriram com o status esperado, sem rolagem horizontal e sem erro no console.');
}
