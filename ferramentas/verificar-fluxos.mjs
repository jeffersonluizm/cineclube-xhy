// Percorre os fluxos do visitante e do editor no Chrome instalado (headless, via playwright-core)
// e confere o que um revisor conferiria à mão. Precisa do site e da API com DEMO_ENABLED.
//   node ferramentas/verificar-fluxos.mjs http://localhost:3000 [pasta-dos-prints]
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
const PRINTS = process.argv[3] || fs.mkdtempSync(path.join(os.tmpdir(), 'cineclube-fluxos-'));
const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
fs.mkdirSync(PRINTS, { recursive: true });

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
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: 'pt-BR' });
const page = await ctx.newPage();
const ir = async (url) => page.goto(BASE + url, { waitUntil: 'networkidle', timeout: 120_000 });
const print = (nome) => page.screenshot({ path: path.join(PRINTS, `${nome}.png`), fullPage: false });

try {
  // ---------- visitante ----------
  await conferir('home abre com a prateleira, convite da demonstração e link do painel no rodapé', async () => {
    const r = await ir('/');
    garantir(r.status() === 200, `status ${r.status()}`);
    garantir(await page.getByRole('heading', { name: 'Explore a demonstração' }).isVisible(), 'sem convite da demonstração');
    garantir((await page.locator('footer a', { hasText: 'painel do editor (demonstração)' }).count()) === 1, 'sem link do painel no rodapé');
  });

  await conferir('segunda edição da revista tem textos', async () => {
    const r = await ir('/revista/2');
    garantir(r.status() === 200, `status ${r.status()}`);
    garantir(await page.getByText('A sala escura como praça pública').first().isVisible(), 'texto da n°2 ausente');
  });

  await conferir('exibição com filmes e programação', async () => {
    const r = await ir('/ciclos-mostras/comedia-moderna');
    garantir(r.status() === 200, `status ${r.status()}`);
    garantir(await page.getByRole('link', { name: 'Meu Tio (1958)' }).isVisible(), 'programação sem link do filme');
  });

  await conferir('/revista/abc responde 404 com a página de não encontrado', async () => {
    const r = await ir('/revista/abc');
    garantir(r.status() === 404, `status ${r.status()}`);
    garantir(!(await page.getByText('serviço indisponível').count()), 'mostrou serviço indisponível');
  });

  await conferir('/autores/ninguem-aqui responde 404 (sem loading que troca o status)', async () => {
    const r = await ir('/autores/ninguem-aqui');
    garantir(r.status() === 404, `status ${r.status()}`);
  });

  await conferir('busca encontra textos', async () => {
    const r = await ir('/busca?q=tempo');
    garantir(r.status() === 200, `status ${r.status()}`);
    garantir((await page.locator('main a[href*="/"]').count()) > 3, 'sem resultados');
  });

  // ---------- editor ----------
  await conferir('entrar como editor de demonstração com um clique abre o início do painel', async () => {
    await ir('/admin/login');
    await page.getByRole('button', { name: /Entrar no painel como editor de demonstração/ }).click();
    await page.waitForURL(/\/admin$/, { timeout: 60_000 });
    await page.getByRole('heading', { level: 1 }).first().waitFor();
    await print('painel-inicio');
  });

  let slugCatalogo = '';
  await conferir('criar catálogo sem capa e ver a capa padrão (título e logo) no site', async () => {
    await ir('/admin/catalogos/novo');
    const titulo = `Catálogo de teste ${Date.now()}`;
    await page.getByLabel(/^título/).fill(titulo);
    await page.getByLabel(/^ano/).fill('2026');
    await page.getByRole('button', { name: /^(salvar|criar)/ }).first().click();
    await page.waitForURL(/\/admin\/catalogos\/[0-9a-f]{24}$/, { timeout: 60_000 });
    slugCatalogo = titulo
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    let r;
    // a revalidação do cache é imediata no painel, mas a primeira visita pode pegar a lista antiga
    for (let i = 0; i < 5; i++) {
      r = await ir(`/catalogos/${slugCatalogo}`);
      if (r.status() === 200) break;
      await page.waitForTimeout(2000);
    }
    garantir(r.status() === 200, `status ${r.status()} em /catalogos/${slugCatalogo}`);
    garantir((await page.getByRole('img', { name: titulo }).count()) === 1, 'sem capa padrão com o título');
    await print('capa-padrao');
  });

  await conferir('item do painel que não existe: título e volta para a lista', async () => {
    await ir('/admin/revistas/000000000000000000000000');
    await page.getByRole('heading', { level: 1, name: /não existe mais/ }).waitFor({ timeout: 30_000 });
    garantir((await page.getByRole('link', { name: /voltar para a lista de revistas/ }).count()) === 1, 'sem link para a lista');
  });

  await conferir('barra de salvar no celular tem fundo opaco e cobre a largura da tela', async () => {
    await page.setViewportSize({ width: 375, height: 740 });
    await ir('/admin/sobre');
    const barra = page.locator('[data-barra-salvar]');
    await barra.waitFor({ timeout: 30_000 });
    const { fundo, largura } = await barra.evaluate((el) => ({
      fundo: getComputedStyle(el).backgroundColor,
      largura: el.getBoundingClientRect().width,
    }));
    await print('barra-salvar-celular');
    garantir(!/rgba\(.*,\s*0(\.\d+)?\)/.test(fundo), `fundo transparente: ${fundo}`);
    garantir(largura >= 360, `barra estreita: ${largura}px`);
    await page.setViewportSize({ width: 1280, height: 800 });
  });
} finally {
  await browser.close();
}

const falhas = resultados.filter((r) => !r.ok);
console.log(`\n${resultados.length - falhas.length}/${resultados.length} conferências passaram. Prints em ${PRINTS}`);
if (falhas.length) process.exitCode = 1;
