// Reset da demonstração com relógio controlado: não depende de a API ficar no ar sem parar
// (o Render gratuito dorme depois de 15 min e perde o disco ao acordar).
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import mongoose from 'mongoose';
import Magazine from '../src/models/Magazine';
import Film from '../src/models/Film';
import Article from '../src/models/Article';
import { abrirBancoEmMemoria } from './helpers/bancoEmMemoria';
import { conferirDemonstracao, lerUltimoReset, resetVencido } from '../src/lib/demo';

let banco: Awaited<ReturnType<typeof abrirBancoEmMemoria>>;
let pasta: string;
const MIN = 60_000;
const AGORA = new Date('2026-10-15T12:00:00Z');
const ENV = { DEMO_ENABLED: 'true', DEMO_RESET_MINUTOS: '60' };
const silencioso = () => {};
const avisos: string[] = [];
const avisarSite = async () => {
  avisos.push('revalidar');
};

before(async () => {
  banco = await abrirBancoEmMemoria();
  pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'cineclube-demo-reset-'));
});
after(async () => {
  await banco?.fechar();
  await fs.promises.rm(pasta, { recursive: true, force: true });
});
beforeEach(async () => {
  await banco.limpar();
  avisos.length = 0;
});

async function bancoDeExemploSujo(ultimoReset: Date | null) {
  await conferirDemonstracao({ agora: new Date(0), env: ENV, pasta, log: silencioso, avisarSite: async () => {} });
  await Magazine.create({ number: 666, volume: 1, month: 'maio', year: 2026, slug: 'vandalismo' });
  const meta = mongoose.connection.collection('demo_meta');
  if (ultimoReset) await meta.updateOne({ _id: 'reset' as never }, { $set: { ultimoReset } }, { upsert: true });
  else await meta.deleteMany({});
}

test('regra do vencimento: sem registro ou com o intervalo passado, vence', () => {
  assert.equal(resetVencido(null, AGORA, 60), true);
  assert.equal(resetVencido(new Date(AGORA.getTime() - 61 * MIN), AGORA, 60), true);
  assert.equal(resetVencido(new Date(AGORA.getTime() - 10 * MIN), AGORA, 60), false);
});

test('partida com banco sujo e último reset antigo: restaura, grava o horário e avisa o site', async () => {
  await bancoDeExemploSujo(new Date(AGORA.getTime() - 2 * 60 * MIN));
  const r = await conferirDemonstracao({ agora: AGORA, env: ENV, pasta, log: silencioso, avisarSite });
  assert.equal(r, 'restaurado');
  assert.equal(await Magazine.countDocuments({ slug: 'vandalismo' }), 0);
  assert.ok((await Magazine.countDocuments()) >= 2);
  assert.equal((await lerUltimoReset())?.getTime(), AGORA.getTime());
  assert.deepEqual(avisos, ['revalidar']);
});

test('último reset recente: mantém o que o visitante fez', async () => {
  await bancoDeExemploSujo(new Date(AGORA.getTime() - 10 * MIN));
  const r = await conferirDemonstracao({ agora: AGORA, env: ENV, pasta, log: silencioso, avisarSite });
  assert.equal(r, 'mantido');
  assert.equal(await Magazine.countDocuments({ slug: 'vandalismo' }), 1);
  assert.deepEqual(avisos, []);
});

test('banco com dados e sem registro de reset (primeira partida desta versão): restaura', async () => {
  await bancoDeExemploSujo(null);
  assert.equal(await conferirDemonstracao({ agora: AGORA, env: ENV, pasta, log: silencioso, avisarSite }), 'restaurado');
});

test('upload que sumiu do disco (o Render perde o disco ao dormir): só a referência sai, sem reset completo', async () => {
  await bancoDeExemploSujo(new Date(AGORA.getTime() - 5 * MIN));
  const sumiu = '/uploads/demo/1700000000000-sumiu.png';
  await Film.updateOne({ slug: 'meu-tio' }, { $set: { image: sumiu } });
  await Magazine.updateOne({ slug: 'vandalismo' }, { $set: { coverImage: sumiu } });
  await Article.updateOne({}, { $push: { blocks: { type: 'image', src: sumiu } } });
  const r = await conferirDemonstracao({ agora: AGORA, env: ENV, pasta, log: silencioso, avisarSite });
  assert.equal(r, 'reparado');
  assert.equal(await Magazine.countDocuments({ slug: 'vandalismo' }), 1, 'o trabalho dos visitantes fica');
  assert.equal((await Film.findOne({ slug: 'meu-tio' }).lean())?.image, '');
  assert.equal((await Magazine.findOne({ slug: 'vandalismo' }).lean())?.coverImage, '');
  assert.equal(await Article.countDocuments({ 'blocks.src': sumiu }), 0, 'bloco de imagem quebrado sai');
  assert.deepEqual(avisos, ['revalidar']);
});

test('o caminho de upload citado em texto corrido não dispara nada', async () => {
  await bancoDeExemploSujo(new Date(AGORA.getTime() - 5 * MIN));
  const texto = 'veja /uploads/demo/qualquer-coisa.png';
  await Article.updateOne({}, { $push: { blocks: { type: 'paragraph', text: texto } }, $set: { content: texto } });
  await Magazine.updateOne({ slug: 'vandalismo' }, { $set: { editorial: texto } });
  assert.equal(await conferirDemonstracao({ agora: AGORA, env: ENV, pasta, log: silencioso, avisarSite }), 'mantido');
  assert.equal(await Magazine.countDocuments({ slug: 'vandalismo' }), 1);
  assert.equal(await Article.countDocuments({ 'blocks.text': texto }), 1);
});

test('imagem enviada que continua no disco não força o reset', async () => {
  await bancoDeExemploSujo(new Date(AGORA.getTime() - 5 * MIN));
  fs.mkdirSync(path.join(pasta, 'demo'), { recursive: true });
  fs.writeFileSync(path.join(pasta, 'demo', '1700000000000-existe.png'), 'x');
  await Film.updateOne({}, { $set: { image: '/uploads/demo/1700000000000-existe.png' } });
  assert.equal(await conferirDemonstracao({ agora: AGORA, env: ENV, pasta, log: silencioso, avisarSite }), 'mantido');
});

test('reset desligado (DEMO_RESET_MINUTOS=0, uso local): só popula banco vazio', async () => {
  await bancoDeExemploSujo(new Date(0));
  const env = { DEMO_ENABLED: 'true', DEMO_RESET_MINUTOS: '0' };
  assert.equal(await conferirDemonstracao({ agora: AGORA, env, pasta, log: silencioso, avisarSite }), 'mantido');
  assert.equal(await Magazine.countDocuments({ slug: 'vandalismo' }), 1);
});

test('avisar o site: POST /api/revalidar em cada origem de FRONTEND_URL, com token de editor', async () => {
  const { avisarSite: avisar } = await import('../src/lib/avisarSite');
  const chamadas: { url: string; auth: string }[] = [];
  const falso = (async (url: string, init: RequestInit) => {
    chamadas.push({ url, auth: String((init.headers as Record<string, string>).Authorization) });
    return new Response('{}');
  }) as unknown as typeof fetch;
  await avisar({ FRONTEND_URL: 'https://a.example, https://b.example/' }, falso);
  assert.deepEqual(
    chamadas.map((c) => c.url),
    ['https://a.example/api/revalidar', 'https://b.example/api/revalidar']
  );
  assert.ok(chamadas.every((c) => /^Bearer ey/.test(c.auth)));
});
