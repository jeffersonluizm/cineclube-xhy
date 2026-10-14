// Orquestrador da carga do Cineclube XHY (Windows).
//
//   node carga/rodar.mjs --rotulo antes
//   node carga/rodar.mjs --rotulo depois --cenarios H1,H9 --niveis 10,50 --sem-build
//
// Ambiente 100% descartável:
//   - MongoDB em memória (mongodb-memory-server) na porta 27200, sem dbPath: nunca a 27018
//     nem backend/data/db, e nenhum .env real;
//   - API compilada (dist/) rodando com o diretório de trabalho FORA do repositório, para o
//     dotenv não ler backend/.env; todas as variáveis vêm daqui;
//   - site com `next build` apontando para a API de teste e `next start` na 3200.
// Só uma carga por vez na máquina: a trava .carga-lock da oficina (carga/trava.mjs) é criada só
// na hora de medir, depois dos builds, e apagada assim que a medição termina. Se outra carga
// estiver com ela, a medição espera (CARGA_ESPERA_MIN, padrão 120 min).
// Depois da última rodada, refaça o build normal do site (npm run build em codigo-fonte/frontend).
import { spawn, execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { popular } from './popular.mjs';
import { caminhoDaTrava, adquirirTrava, liberarTrava } from './trava.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BACKEND = path.join(RAIZ, 'codigo-fonte/backend');
const FRONTEND = path.join(RAIZ, 'codigo-fonte/frontend');
// Trava compartilhada da oficina (caminho absoluto: vale também quando a carga roda de um worktree)
const TRAVA = caminhoDaTrava();
const K6 = process.env.K6_BIN || 'C:\\Program Files\\k6\\k6.exe';
const PORTA_MONGO = 27200;
const PORTA_API = 3201;
const PORTA_SITE = 3200;
const API = `http://localhost:${PORTA_API}`;
const SITE = `http://localhost:${PORTA_SITE}`;

const requireBackend = createRequire(path.join(BACKEND, 'package.json'));

// ---------- argumentos ----------
const args = process.argv.slice(2);
const arg = (nome, padrao) => {
  const i = args.indexOf(`--${nome}`);
  return i >= 0 ? args[i + 1] : padrao;
};
const ROTULO = arg('rotulo', 'antes');
const CENARIOS = (arg('cenarios', 'H1,H2,H3,H4,H5,H6,H7,H8,H9,H11') || '').split(',');
const NIVEIS = arg('niveis', '10,50,100,200').split(',').map(Number);
const DURACAO = arg('duracao', '15s');
const SEM_BUILD = args.includes('--sem-build');
const SAIDA = path.join(RAIZ, 'carga/resultados', ROTULO);

const log = (...m) => console.log(`[carga ${new Date().toLocaleTimeString('pt-BR')}]`, ...m);
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- processos ----------
const filhos = [];
function iniciar(nome, comando, argumentos, opcoes) {
  const p = spawn(comando, argumentos, { ...opcoes, windowsHide: true });
  const arquivoLog = fs.createWriteStream(path.join(SAIDA, `${nome}.log`));
  p.stdout.pipe(arquivoLog);
  p.stderr.pipe(arquivoLog);
  filhos.push({ nome, p });
  return p;
}
function matar(p) {
  if (!p || p.exitCode !== null) return;
  try {
    execFileSync('taskkill', ['/pid', String(p.pid), '/T', '/F'], { stdio: 'ignore' });
  } catch {
    /* já saiu */
  }
}
function rodarAteFim(comando, argumentos, opcoes) {
  return new Promise((resolve, reject) => {
    const p = spawn(comando, argumentos, { ...opcoes, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let saida = '';
    p.stdout.on('data', (d) => (saida += d));
    p.stderr.on('data', (d) => (saida += d));
    p.on('close', (code) => (code === 0 ? resolve(saida) : reject(new Error(`${comando} saiu com ${code}\n${saida.slice(-3000)}`))));
  });
}
async function esperarHttp(url, ok = (r) => r.ok, limiteMs = 120_000) {
  const ini = Date.now();
  while (Date.now() - ini < limiteMs) {
    try {
      const r = await fetch(url);
      if (await ok(r)) return;
    } catch {
      /* ainda subindo */
    }
    await esperar(500);
  }
  throw new Error(`Tempo esgotado esperando ${url}`);
}
function portaLivre(porta) {
  try {
    const out = execFileSync('netstat', ['-ano'], { encoding: 'utf8' });
    return !out.split('\n').some((l) => l.includes('LISTENING') && new RegExp(`:${porta}\\s`).test(l));
  } catch {
    return true;
  }
}

// ---------- amostragem de CPU e memória (PowerShell) ----------
function descendentes(pid) {
  try {
    const out = execFileSync(
      'powershell',
      ['-NoProfile', '-Command', 'Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId | ConvertTo-Json -Compress'],
      { encoding: 'utf8' }
    );
    const lista = JSON.parse(out);
    const todos = new Set([pid]);
    let mudou = true;
    while (mudou) {
      mudou = false;
      for (const p of lista) if (todos.has(p.ParentProcessId) && !todos.has(p.ProcessId)) (todos.add(p.ProcessId), (mudou = true));
    }
    return [...todos];
  } catch {
    return [pid];
  }
}
function amostrador(grupos) {
  // grupos: { api: [pids], site: [pids], mongod: [pids] }
  const ids = Object.values(grupos).flat();
  const ps = spawn(
    'powershell',
    [
      '-NoProfile',
      '-Command',
      `while($true){ $t=[DateTimeOffset]::Now.ToUnixTimeMilliseconds(); Get-Process -Id ${ids.join(',')} -ErrorAction SilentlyContinue | % { "$t;$($_.Id);$($_.TotalProcessorTime.TotalMilliseconds);$($_.WorkingSet64)" }; Start-Sleep -Milliseconds 1000 }`,
    ],
    { windowsHide: true }
  );
  const amostras = [];
  let resto = '';
  ps.stdout.on('data', (d) => {
    resto += d;
    const linhas = resto.split(/\r?\n/);
    resto = linhas.pop();
    for (const l of linhas) {
      const [t, id, cpu, mem] = l.split(';').map(Number);
      if (!Number.isNaN(t)) amostras.push({ t, id, cpu, mem });
    }
  });
  const grupoDe = (id) => Object.keys(grupos).find((g) => grupos[g].includes(id));
  return {
    parar: () => matar(ps),
    /** CPU média (% da máquina inteira, 12 threads) e pico de memória (MB) por grupo entre t0 e t1 */
    janela(t0, t1) {
      const resultado = {};
      for (const g of Object.keys(grupos)) {
        const doGrupo = amostras.filter((a) => grupoDe(a.id) === g && a.t >= t0 - 1500 && a.t <= t1 + 1500);
        const porId = {};
        for (const a of doGrupo) (porId[a.id] ||= []).push(a);
        let cpuMs = 0;
        let memPico = 0;
        const instantes = {};
        for (const lista of Object.values(porId)) {
          cpuMs += lista.at(-1).cpu - lista[0].cpu;
          for (const a of lista) instantes[a.t] = (instantes[a.t] || 0) + a.mem;
        }
        memPico = Math.max(0, ...Object.values(instantes));
        const wall = Math.max(1, t1 - t0);
        resultado[g] = { cpuPct: +((cpuMs / wall / os.cpus().length) * 100).toFixed(1), memMB: Math.round(memPico / 1048576) };
      }
      return resultado;
    },
  };
}

// ---------- k6 ----------
async function k6({ alvo, metodo = 'GET', corpo, token, vus, duracao, iteracoes, arquivo }) {
  const env = {
    ...process.env,
    ALVO: alvo,
    METODO: metodo,
    CORPO: corpo || '',
    TOKEN: token || '',
    VUS: String(vus),
    SAIDA: arquivo,
    K6_NO_USAGE_REPORT: 'true',
  };
  if (iteracoes) env.ITERACOES = String(iteracoes);
  else env.DURACAO = duracao;
  delete env.HTTP_PROXY;
  delete env.HTTPS_PROXY;
  await rodarAteFim(K6, ['run', '-q', path.join(RAIZ, 'carga/k6/cenario.js')], { env });
  return JSON.parse(fs.readFileSync(arquivo, 'utf8'));
}

// ---------- principal ----------
async function principal() {
  fs.mkdirSync(SAIDA, { recursive: true });
  for (const p of [PORTA_MONGO, PORTA_API, PORTA_SITE]) {
    if (!portaLivre(p)) throw new Error(`Porta ${p} ocupada: pare o que estiver nela antes da carga.`);
  }
  if (PORTA_MONGO === 27018) throw new Error('27018 é a porta do banco de desenvolvimento: proibida na carga.');

  const commit = execFileSync('git', ['-C', RAIZ, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
  const meta = {
    rotulo: ROTULO,
    commit,
    data: new Date().toISOString(),
    maquina: `${os.cpus()[0].model.trim()} (${os.cpus().length} threads), ${Math.round(os.totalmem() / 1073741824)} GB`,
    node: process.version,
    niveis: NIVEIS,
    duracao: DURACAO,
    observacao: 'gerador (k6) e servidores dividem a mesma máquina: números servem para comparar antes e depois',
  };
  log('meta', meta);

  // 1. Banco descartável em memória
  const { MongoMemoryServer } = requireBackend('mongodb-memory-server');
  const mongod = await MongoMemoryServer.create({ instance: { port: PORTA_MONGO, dbName: 'cineclube_carga' } });
  filhos.push({ nome: 'mongod', p: { pid: mongod.instanceInfo.instance.mongodProcess.pid, exitCode: null }, parar: () => mongod.stop() });
  const uri = mongod.getUri('cineclube_carga');
  if (!uri.includes(`:${PORTA_MONGO}/`)) throw new Error(`URI inesperada para a carga: ${uri}`);
  log('banco em memória', uri);
  let massa = await popular(uri, { revistas: 30 });
  log('massa', massa);

  // 2. API compilada, com cwd fora do repositório e variáveis só daqui
  if (!SEM_BUILD) {
    log('compilando a API (tsc)...');
    await rodarAteFim(process.execPath, [path.join(BACKEND, 'node_modules/typescript/bin/tsc'), '-p', BACKEND], { cwd: BACKEND });
  }
  const cwdApi = fs.mkdtempSync(path.join(os.tmpdir(), 'cineclube-carga-'));
  if (cwdApi.startsWith(RAIZ) || fs.existsSync(path.join(cwdApi, '.env'))) throw new Error('cwd da API inválido para a carga');
  const senha = crypto.randomBytes(12).toString('hex');
const segredoServidor = crypto.randomBytes(32).toString('hex');
  const envBase = { ...process.env };
  for (const k of Object.keys(envBase)) {
    if (/^(MONGODB_URI|CLOUDINARY_|ADMIN_PASSWORD|JWT_SECRET|FRONTEND_URL|NEXT_PUBLIC_|RATE_LIMIT_|SERVIDOR_SEGREDO|DEMO_|LIMITE_SITE)/.test(k)) delete envBase[k];
  }
  const envApi = {
    ...envBase,
    NODE_ENV: 'production',
    PORT: String(PORTA_API),
    MONGODB_URI: uri,
    ADMIN_PASSWORD: senha,
    JWT_SECRET: crypto.randomBytes(32).toString('hex'),
    FRONTEND_URL: SITE,
    CINECLUBE_PROIBIR_BANCO_DEV: '1',
    // limitador geral desligado para medir vazão (o H6 mede os limitadores separadamente)
    RATE_LIMIT_GERAL: '0',
    SERVIDOR_SEGREDO: segredoServidor,
    // máquina compartilhada: prazo folgado para achar o banco (ignorado pelo código antigo)
    MONGODB_TIMEOUT_MS: '60000',
  };
  const api = iniciar('api', process.execPath, [path.join(BACKEND, 'dist/index.js')], { cwd: cwdApi, env: envApi });
  await esperarHttp(`${API}/api/health`, async (r) => r.ok && (await r.json()).db === 'connected');
  // Portão: a API precisa estar lendo a massa deste banco (30 revistas), não outro
  const revistas = await (await fetch(`${API}/api/revista`)).json();
  if (!Array.isArray(revistas) || revistas.length !== 30) throw new Error(`A API não está no banco da carga (revistas: ${revistas.length})`);
  log('API pronta e conferida no banco da carga');

  // 3. Site com build apontando para a API de teste
  // LIMITE_SITE=0: a contenção por IP do site é medida à parte (k6 sai de um IP só)
const envSite = { ...envBase, NEXT_PUBLIC_API_URL: API, NEXT_PUBLIC_SITE_URL: SITE, NEXT_TELEMETRY_DISABLED: '1', SERVIDOR_SEGREDO: segredoServidor, LIMITE_SITE: '0' };
  if (!SEM_BUILD) {
    log('next build apontando para a API de teste...');
    await rodarAteFim(process.execPath, [path.join(FRONTEND, 'node_modules/next/dist/bin/next'), 'build'], { cwd: FRONTEND, env: envSite });
  }
  const site = iniciar('site', process.execPath, [path.join(FRONTEND, 'node_modules/next/dist/bin/next'), 'start', '-p', String(PORTA_SITE)], {
    cwd: FRONTEND,
    env: { ...envSite, NODE_ENV: 'production' },
  });
  await esperarHttp(`${SITE}/sobre`);
  log('site pronto');

  const grupos = {
    api: descendentes(api.pid),
    site: descendentes(site.pid),
    mongod: [mongod.instanceInfo.instance.mongodProcess.pid],
  };
  // Builds prontos: daqui em diante é medição, então só com a trava da oficina
  await esperarTrava(meta);
  const amostra = amostrador(grupos);
  await esperar(2500);

  // consultas ao banco por requisição (opcounters.query: cada find/findOne/exists conta 1)
  const { MongoClient } = requireBackend('mongodb');
  const admin = new MongoClient(uri);
  await admin.connect();
  async function consultasPor(url) {
    await fetch(url); // aquece
    const a = (await admin.db('admin').command({ serverStatus: 1 })).opcounters;
    const r = await fetch(url);
    const corpo = await r.arrayBuffer();
    const b = (await admin.db('admin').command({ serverStatus: 1 })).opcounters;
    return { status: r.status, consultas: b.query - a.query + (b.getmore - a.getmore), bytes: corpo.byteLength };
  }

  const resultados = { meta, massa, cenarios: {}, consultas: {} };
  const salvar = () => fs.writeFileSync(path.join(SAIDA, 'resultados.json'), JSON.stringify(resultados, null, 2));

  async function degraus(id, descricao, alvo, extra = {}, niveis = NIVEIS) {
    log(`${id}: ${descricao}`);
    await k6({ alvo, vus: 10, duracao: '5s', arquivo: path.join(SAIDA, `${id}-aquecimento.json`), ...extra });
    const passos = [];
    for (const vus of niveis) {
      const t0 = Date.now();
      const r = await k6({ alvo, vus, duracao: DURACAO, arquivo: path.join(SAIDA, `${id}-${vus}.json`), ...extra });
      const recursos = amostra.janela(t0, Date.now());
      passos.push({ ...r, recursos });
      log(`  ${vus} VUs: ${r.rps.toFixed(0)} req/s, p95 ${r.p95.toFixed(1)} ms, falhas ${(r.falhas * 100).toFixed(2)}%`);
      await esperar(1500);
    }
    resultados.cenarios[id] = { descricao, alvo, passos };
    salvar();
  }

  const login = async (s) =>
    fetch(`${API}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: s }) });
  const token = (await (await login(senha)).json()).token;
  if (!token) throw new Error('login da carga falhou');

  const rev = massa.revistaAlvo;
  const urlArtigo = `${API}/api/revista/${rev}/artigo/${massa.textoAlvo}`;
  const urlCiclo = `${API}/api/ciclos/${massa.cicloAlvo}`;
  const urlFilme = `${API}/api/ciclos/${massa.cicloAlvo}/filme/${massa.filmeAlvo}`;
  const urlTextoCiclo = `${API}/api/ciclos/${massa.cicloAlvo}/texto/${massa.textoCicloAlvo}`;
  for (const [nome, url] of Object.entries({
    home: `${API}/api/home`,
    revista: `${API}/api/revista/${rev}`,
    artigo: urlArtigo,
    ciclo: urlCiclo,
    filme: urlFilme,
    textoCiclo: urlTextoCiclo,
    siteHome: `${SITE}/`,
    siteRevista: `${SITE}/revista/${rev}`,
    siteArtigo: `${SITE}/revista/${rev}/artigo/${massa.textoAlvo}`,
  })) {
    resultados.consultas[nome] = await consultasPor(url);
  }
  log('consultas por requisição', resultados.consultas);
  salvar();

  const quer = (h) => CENARIOS.includes(h);

  if (quer('H1')) await degraus('H1', 'GET /api/health (linha de base, sem banco)', `${API}/api/health`);

  if (quer('H2')) {
    for (const n of [1, 10, 30]) {
      massa = await popular(uri, { revistas: n });
      resultados.consultas[`home-${n}`] = await consultasPor(`${API}/api/home`);
      await degraus(`H2-${n}`, `GET /api/home com ${n} revistas`, `${API}/api/home`);
    }
    massa = await popular(uri, { revistas: 30 });
  }

  if (quer('H3')) await degraus('H3', `GET /api/revista/${rev} (sumário, 15 textos de 25 blocos)`, `${API}/api/revista/${rev}`);

  if (quer('H4')) {
    await degraus('H4-revista', 'GET artigo da revista (anterior/próximo)', urlArtigo);
    await degraus('H4-ciclo', 'GET texto do ciclo (anterior/próximo)', urlTextoCiclo);
  }

  if (quer('H5')) {
    await degraus('H5-ciclo', 'GET ciclo (25 filmes, 5 textos)', urlCiclo);
    await degraus('H5-filme', 'GET filme do ciclo', urlFilme);
  }

  // H7 e H8 antes do H6: o H6 esgota o limite de login deste IP
  if (quer('H7')) {
    const idRevista1 = (await (await fetch(`${API}/api/revista`)).json()).find((m) => m.number === 1)._id;
    const corpo = JSON.stringify({
      title: 'Mesmo título concorrente',
      author: 'Carga',
      column: 'crítica',
      blocks: [{ type: 'paragraph', text: 'texto' }],
      parentType: 'revista',
      parentId: idRevista1,
    });
    resultados.cenarios.H7 = { descricao: 'POST /api/admin/artigos com o mesmo título (slug concorrente)', passos: [] };
    for (const vus of [1, 10]) {
      const t0 = Date.now();
      const r = await k6({ alvo: `${API}/api/admin/artigos`, metodo: 'POST', corpo, token, vus, iteracoes: 150, arquivo: path.join(SAIDA, `H7-${vus}.json`) });
      resultados.cenarios.H7.passos.push({ ...r, recursos: amostra.janela(t0, Date.now()) });
      log(`H7 ${vus} VUs: ${r.rps.toFixed(0)} req/s, p95 ${r.p95.toFixed(1)} ms, 5xx ${r.s5xx}`);
    }
    salvar();
  }

  if (quer('H8')) {
    const idRevista = (await (await fetch(`${API}/api/revista`)).json()).find((m) => m.number === 1)._id;
    const lista = await (await fetch(`${API}/api/admin/artigos?parentId=${idRevista}`, { headers: { Authorization: `Bearer ${token}` } })).json();
    const ids = lista.slice(0, 50).map((a) => a._id);
    resultados.cenarios.H8_ids = ids.length;
    await degraus('H8', `PUT /api/admin/artigos/reorder com ${ids.length} ids`, `${API}/api/admin/artigos/reorder`, {
      metodo: 'PUT',
      corpo: JSON.stringify({ ids }),
      token,
    }, NIVEIS.filter((v) => v <= 50));
  }

  if (quer('H6')) {
    resultados.cenarios.H6 = { descricao: 'login: senha certa (vazão) e senha errada (limite)', passos: [] };
    const certo = await k6({
      alvo: `${API}/api/auth/login`,
      metodo: 'POST',
      corpo: JSON.stringify({ password: senha }),
      vus: 50,
      duracao: DURACAO,
      arquivo: path.join(SAIDA, 'H6-certa.json'),
    });
    resultados.cenarios.H6.passos.push({ tipo: 'senha certa', ...certo });
    const errado = await k6({
      alvo: `${API}/api/auth/login`,
      metodo: 'POST',
      corpo: JSON.stringify({ password: 'senha-errada' }),
      vus: 1,
      iteracoes: 30,
      arquivo: path.join(SAIDA, 'H6-errada.json'),
    });
    resultados.cenarios.H6.passos.push({ tipo: 'senha errada (30 tentativas seguidas)', ...errado });
    log('H6', resultados.cenarios.H6.passos.map((p) => `${p.tipo}: 2xx ${p.s2xx} 4xx ${p.s4xx} 429 ${p.s429} rps ${p.rps.toFixed(0)}`));
    salvar();
  }

  if (quer('H9')) {
    const paginas = {
      'H9-home': `${SITE}/`,
      'H9-revistas': `${SITE}/revista`,
      'H9-sumario': `${SITE}/revista/${rev}`,
      'H9-artigo': `${SITE}/revista/${rev}/artigo/${massa.textoAlvo}`,
      'H9-ciclo': `${SITE}/ciclos-mostras/${massa.cicloAlvo}`,
    };
    for (const [id, url] of Object.entries(paginas)) await degraus(id, `site ${url.replace(SITE, '') || '/'}`, url, {}, NIVEIS.filter((v) => v <= 100));
  }

  if (quer('H11')) {
    log('H11: derrubando a API e pedindo páginas ao site');
    matar(api);
    await esperar(1500);
    const paginas = ['/', '/revista', '/catalogos', `/revista/${rev}`, `/revista/${rev}/artigo/${massa.textoAlvo}`, `/ciclos-mostras/${massa.cicloAlvo}`];
    resultados.cenarios.H11 = [];
    for (const p of paginas) {
      const ini = Date.now();
      let status = 0;
      let corpo = '';
      try {
        const r = await fetch(`${SITE}${p}`, { signal: AbortSignal.timeout(90_000) });
        status = r.status;
        corpo = await r.text();
      } catch (e) {
        corpo = String(e);
      }
      const texto = corpo.replace(/<[^>]+>/g, ' ');
      resultados.cenarios.H11.push({
        pagina: p,
        status,
        ms: Date.now() - ini,
        mostra404: /fim da sessão|não encontrad/i.test(texto),
        mostraVazio: /Nenhum[a]? .* disponível|Em breve/i.test(texto),
        mostraIndisponivel: /indispon[ií]vel|fora do ar/i.test(texto),
      });
    }
    log('H11', resultados.cenarios.H11);
    salvar();
  }

  amostra.parar();
  await admin.close();
  meta.medicaoFim = new Date().toISOString();
  salvar();
  liberarTrava(TRAVA);
  travaCriada = false;
  log('trava liberada', TRAVA);
  log(`fim; resultados em ${path.relative(RAIZ, SAIDA)}`);
}

// ---------- trava e limpeza ----------
let travaCriada = false;
async function esperarTrava(meta) {
  const limite = Date.now() + Number(process.env.CARGA_ESPERA_MIN || 120) * 60_000;
  let avisou = false;
  while (!adquirirTrava(TRAVA)) {
    if (Date.now() > limite) throw new Error(`Outra carga ficou com ${TRAVA} por tempo demais.`);
    if (!avisou) log(`outra carga em andamento (${TRAVA} existe); esperando a vez...`);
    avisou = true;
    await esperar(15_000);
  }
  travaCriada = true;
  meta.trava = TRAVA;
  meta.medicaoInicio = new Date().toISOString();
  log('trava adquirida', TRAVA);
}
async function limpar() {
  for (const f of filhos.reverse()) {
    try {
      if (f.parar) await f.parar();
      else matar(f.p);
    } catch {
      /* segue */
    }
  }
  if (travaCriada) liberarTrava(TRAVA);
}
process.on('SIGINT', async () => {
  await limpar();
  process.exit(130);
});

try {
  await principal();
  await limpar();
} catch (e) {
  console.error(e);
  await limpar();
  process.exit(1);
}
