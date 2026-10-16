// Cenário genérico do k6: o orquestrador (carga/rodar.mjs) passa tudo por variáveis de ambiente.
//   ALVO      URL (ou várias separadas por "|", sorteadas a cada iteração)
//   METODO    GET (padrão), POST ou PUT
//   CORPO     corpo JSON (texto); "{i}" vira um número único por iteração
//   TOKEN     Bearer opcional
//   VUS       usuários virtuais (conexões simultâneas)
//   DURACAO   ex.: 15s  (ou ITERACOES para um total fixo de iterações compartilhadas)
//   SAIDA     arquivo JSON do resumo
import http from 'k6/http';
import { Counter } from 'k6/metrics';
import exec from 'k6/execution';

const alvos = (__ENV.ALVO || '').split('|').filter(Boolean);
const metodo = (__ENV.METODO || 'GET').toUpperCase();
const vus = Number(__ENV.VUS || 10);

const status2xx = new Counter('status_2xx');
const status3xx = new Counter('status_3xx');
const status4xx = new Counter('status_4xx');
const status429 = new Counter('status_429');
const status5xx = new Counter('status_5xx');
const semResposta = new Counter('sem_resposta');

export const options = {
  discardResponseBodies: false,
  summaryTrendStats: ['avg', 'med', 'p(95)', 'p(99)', 'max'],
  scenarios: {
    principal: __ENV.ITERACOES
      ? { executor: 'shared-iterations', vus, iterations: Number(__ENV.ITERACOES), maxDuration: '5m' }
      : { executor: 'constant-vus', vus, duration: __ENV.DURACAO || '15s' },
  },
};

export default function () {
  const url = alvos[Math.floor(Math.random() * alvos.length)];
  const params = { headers: { 'Content-Type': 'application/json' }, redirects: 0, timeout: '30s' };
  if (__ENV.TOKEN) params.headers.Authorization = `Bearer ${__ENV.TOKEN}`;
  const corpo = (__ENV.CORPO || '').replace(/\{i\}/g, String(exec.scenario.iterationInTest));

  const res = metodo === 'GET' ? http.get(url, params) : http.request(metodo, url, corpo, params);

  if (res.status === 0) semResposta.add(1);
  else if (res.status < 300) status2xx.add(1);
  else if (res.status < 400) status3xx.add(1);
  else if (res.status === 429) status429.add(1);
  else if (res.status < 500) status4xx.add(1);
  else status5xx.add(1);
}

export function handleSummary(data) {
  const m = data.metrics;
  const valor = (nome, campo) => (m[nome] && m[nome].values ? m[nome].values[campo] : 0) || 0;
  const resumo = {
    vus,
    reqs: valor('http_reqs', 'count'),
    rps: valor('http_reqs', 'rate'),
    p50: valor('http_req_duration', 'med'),
    p95: valor('http_req_duration', 'p(95)'),
    p99: valor('http_req_duration', 'p(99)'),
    max: valor('http_req_duration', 'max'),
    falhas: valor('http_req_failed', 'rate'),
    bytesRecebidos: valor('data_received', 'count'),
    s2xx: valor('status_2xx', 'count'),
    s3xx: valor('status_3xx', 'count'),
    s4xx: valor('status_4xx', 'count'),
    s429: valor('status_429', 'count'),
    s5xx: valor('status_5xx', 'count'),
    semResposta: valor('sem_resposta', 'count'),
  };
  return { [__ENV.SAIDA || 'resumo.json']: JSON.stringify(resumo, null, 2) };
}
