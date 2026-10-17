// Confere o site e o painel num celular (375×812, toque) no Chrome instalado, via playwright-core.
// Precisa do site e de uma API com DEMO_ENABLED (o painel entra pelo botão de demonstração).
//   node ferramentas/verificar-celular.mjs http://localhost:3107 [pasta-dos-prints]
// Sai com código 1 se alguma conferência falhar. Os prints vão para a pasta indicada
// (padrão: a pasta temporária do sistema), nunca para o repositório.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = createRequire(path.join(raiz, 'codigo-fonte/frontend/package.json'))('playwright-core');
const BASE = (process.argv[2] || 'http://localhost:3000').replace(/\/$/, '');
const PRINTS = process.argv[3] || fs.mkdtempSync(path.join(os.tmpdir(), 'cineclube-celular-'));
const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
fs.mkdirSync(PRINTS, { recursive: true });

/** Altura mínima de um alvo de toque (Apple HIG e Material recomendam 44 a 48px) */
const ALVO = 44;

const resultados = [];
async function conferir(nome, fn) {
  try {
    await fn();
    resultados.push({ nome, ok: true });
    console.log(`[ok] ${nome}`);
  } catch (e) {
    resultados.push({ nome, ok: false, erro: e.message });
    console.log(`[FALHOU] ${nome}: ${e.message}`);
  }
}
const garantir = (condicao, mensagem) => {
  if (!condicao) throw new Error(mensagem);
};

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const celular = await browser.newContext({
  viewport: { width: 375, height: 812 },
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 2,
  locale: 'pt-BR',
});
const page = await celular.newPage();
const ir = async (url) => page.goto(BASE + url, { waitUntil: 'networkidle', timeout: 120_000 });
const print = (nome) => page.screenshot({ path: path.join(PRINTS, `${nome}.png`), fullPage: true });

/** Alvos visíveis menores que o mínimo dentro de um seletor */
const alvosPequenos = (seletor) =>
  page.$$eval(
    seletor,
    (els, min) =>
      els
        .filter((e) => {
          const r = e.getBoundingClientRect();
          return r.width > 1 && r.height > 1 && getComputedStyle(e).visibility !== 'hidden';
        })
        .filter((e) => e.getBoundingClientRect().height < min)
        .map(
          (e) =>
            `${(e.innerText || e.getAttribute('aria-label') || e.tagName).trim().slice(0, 25)} (${Math.round(e.getBoundingClientRect().height)}px)`
        ),
    ALVO
  );

const semRolagemLateral = async () =>
  garantir(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'a página rola para o lado');

try {
  // ---------- site público ----------
  for (const url of ['/', '/ciclos-mostras', '/sobre', '/busca', '/revista', '/catalogos']) {
    await conferir(`${url}: barra fina e fixa com menu fechado, sem rolagem lateral`, async () => {
      const r = await ir(url);
      garantir(r.status() === 200, `status ${r.status()}`);
      const barra = page.locator('header[data-barra-celular]');
      garantir(await barra.isVisible(), 'sem a barra do celular');
      const caixa = await barra.boundingBox();
      garantir(caixa.height <= 64, `barra com ${Math.round(caixa.height)}px (máximo 64)`);
      const pos = await barra.evaluate((e) => getComputedStyle(e).position);
      garantir(pos === 'sticky' || pos === 'fixed', `barra não fica no topo (${pos})`);
      const botao = page.getByRole('button', { name: 'abrir o menu' });
      garantir((await botao.getAttribute('aria-expanded')) === 'false', 'menu começa aberto');
      const b = await botao.boundingBox();
      garantir(b.height >= ALVO && b.width >= ALVO, `botão do menu com ${Math.round(b.width)}×${Math.round(b.height)}px`);
      await semRolagemLateral();
    });
  }

  await conferir('menu abre com os 5 links grandes, fecha com Esc e devolve o foco ao botão', async () => {
    await ir('/sobre');
    const botao = page.getByRole('button', { name: 'abrir o menu' });
    await botao.click();
    garantir(
      (await page.getByRole('button', { name: 'fechar o menu' }).getAttribute('aria-expanded')) === 'true',
      'aria-expanded não virou true'
    );
    const menu = page.locator('#menu-celular');
    garantir(await menu.isVisible(), 'gaveta não apareceu');
    for (const nome of ['revista', 'exibições', 'catálogos', 'sobre', 'busca']) {
      const link = menu.getByRole('link', { name: nome, exact: true });
      const c = await link.boundingBox();
      garantir(c && c.height >= ALVO, `link "${nome}" com ${c ? Math.round(c.height) : 0}px`);
    }
    garantir((await menu.locator('a[aria-current="page"]').innerText()).trim() === 'sobre', 'página atual não marcada');
    await print('celular-menu-aberto');
    await page.keyboard.press('Escape');
    garantir(!(await menu.isVisible()), 'Esc não fechou');
    garantir(
      await page.evaluate(() => document.activeElement?.getAttribute('aria-controls') === 'menu-celular'),
      'foco não voltou ao botão'
    );
  });

  await conferir('tocar num link do menu navega e fecha a gaveta', async () => {
    await ir('/sobre');
    await page.getByRole('button', { name: 'abrir o menu' }).click();
    await page.locator('#menu-celular').getByRole('link', { name: 'exibições', exact: true }).click();
    await page.waitForURL('**/ciclos-mostras');
    garantir(!(await page.locator('#menu-celular').isVisible()), 'gaveta continuou aberta');
  });

  await conferir('rodapé e caminho (migalhas) com alvos de toque de 44px', async () => {
    await ir('/sobre');
    const pequenos = [...(await alvosPequenos('footer a')), ...(await alvosPequenos('nav[aria-label="caminho"] a'))];
    garantir(pequenos.length === 0, pequenos.join(', '));
    await print('celular-sobre');
  });

  await conferir('home sem edições: o "em breve" aparece logo abaixo da barra', async () => {
    await ir('/');
    const emBreve = page.getByText('em breve', { exact: true });
    if ((await emBreve.count()) === 0) return; // com edições, a prateleira é a home
    const c = await emBreve.boundingBox();
    garantir(c.y < 360, `"em breve" a ${Math.round(c.y)}px do topo`);
  });

  // ---------- desktop continua igual ----------
  await conferir('desktop: menu lateral visível e sem barra do celular', async () => {
    const desktop = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: 'pt-BR' });
    const p = await desktop.newPage();
    await p.goto(BASE + '/sobre', { waitUntil: 'networkidle', timeout: 120_000 });
    garantir(!(await p.locator('header[data-barra-celular]').isVisible()), 'barra do celular aparece no desktop');
    garantir(await p.locator('aside nav[aria-label="principal"]').isVisible(), 'menu lateral sumiu');
    await desktop.close();
  });

  // ---------- painel ----------
  await conferir('painel: barra fina com menu e botões do editor com 44px', async () => {
    await ir('/admin/login');
    await page.getByRole('button', { name: /editor de demonstração/ }).click({ timeout: 120_000 });
    await page.waitForURL('**/admin', { timeout: 60_000 });
    const barra = page.locator('header[data-barra-celular]');
    const caixa = await barra.boundingBox();
    garantir(caixa.height <= 64, `barra do painel com ${Math.round(caixa.height)}px`);
    await page.getByRole('button', { name: 'abrir o menu' }).click();
    const menu = page.locator('#menu-celular');
    for (const nome of ['início', 'revistas', 'catálogos', 'exibições', 'sobre', 'sair']) {
      const c = await menu.getByRole('link', { name: nome, exact: true }).boundingBox();
      garantir(c && c.height >= ALVO, `"${nome}" com ${c ? Math.round(c.height) : 0}px`);
    }
    await print('celular-painel-menu');
    await page.keyboard.press('Escape');
    await semRolagemLateral();

    // editor de texto: a primeira exibição da demonstração recebe um texto novo
    await ir('/admin/ciclos');
    await page.locator('main a[href^="/admin/ciclos/"]:not([href$="/novo"])').first().click();
    await page.locator('main a[href$="/textos/novo"]').first().click();
    await page.waitForURL('**/textos/novo');
    const pequenos = await alvosPequenos('main button');
    garantir(pequenos.length === 0, pequenos.join(', '));
    await semRolagemLateral();
    await print('celular-editor');
  });
} finally {
  await browser.close();
}

const falhas = resultados.filter((r) => !r.ok);
console.log(`\n${resultados.length - falhas.length}/${resultados.length} conferências ok. Prints em ${PRINTS}`);
process.exit(falhas.length ? 1 : 0);
