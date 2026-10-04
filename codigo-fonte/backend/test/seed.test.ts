import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import Magazine from '../src/models/Magazine';
import Article from '../src/models/Article';
import About from '../src/models/About';
import { executarSeed, pedeForce, respostaConfirma } from '../src/scripts/seed';
import { abrirBancoEmMemoria } from './helpers/bancoEmMemoria';

let banco: Awaited<ReturnType<typeof abrirBancoEmMemoria>>;
const silencioso = () => {};
const naoDeviaPerguntar = async (): Promise<boolean> => {
  throw new Error('não devia pedir confirmação');
};

before(async () => {
  banco = await abrirBancoEmMemoria();
});
after(async () => {
  await banco.fechar();
});
beforeEach(async () => {
  await banco.limpar();
});

async function criarRevistaDoEditor() {
  await Magazine.create({ number: 99, volume: 3, month: 'maio', year: 2027, slug: 'n99' });
}

test('com dados existentes, sem --force e sem confirmação, não apaga nada', async () => {
  await criarRevistaDoEditor();
  let perguntas = 0;

  const resultado = await executarSeed({
    force: false,
    confirmar: async () => {
      perguntas++;
      return false;
    },
    log: silencioso,
  });

  assert.equal(resultado, 'cancelado');
  assert.equal(perguntas, 1);
  const revistas = await Magazine.find();
  assert.deepEqual(
    revistas.map((r) => r.number),
    [99]
  );
});

test('com dados existentes e confirmação, substitui pelos dados de exemplo', async () => {
  await criarRevistaDoEditor();

  const resultado = await executarSeed({ force: false, confirmar: async () => true, log: silencioso });

  assert.equal(resultado, 'aplicado');
  const revistas = await Magazine.find();
  assert.deepEqual(
    revistas.map((r) => r.number),
    [1]
  );
});

test('com --force, substitui sem perguntar', async () => {
  await criarRevistaDoEditor();

  const resultado = await executarSeed({ force: true, confirmar: naoDeviaPerguntar, log: silencioso });

  assert.equal(resultado, 'aplicado');
  assert.equal(await Magazine.countDocuments({ number: 99 }), 0);
});

test('banco vazio é populado sem perguntar', async () => {
  const resultado = await executarSeed({ force: false, confirmar: naoDeviaPerguntar, log: silencioso });

  assert.equal(resultado, 'aplicado');
  assert.equal(await Magazine.countDocuments(), 1);
});

test('equipe do Sobre usa nomes e contatos fictícios', async () => {
  await executarSeed({ force: true, confirmar: naoDeviaPerguntar, log: silencioso });

  const sobre = await About.findOne();
  assert.ok(sobre && sobre.team.length > 0);
  for (const membro of sobre.team) {
    assert.match(membro.email ?? '', /@exemplo\.com$/, membro.email);
  }
  assert.doesNotMatch(JSON.stringify(sobre.team), /ufpe|prysthon|nicoleli|barros/i);
});

test('dados de exemplo trazem um texto publicado de ciclo', async () => {
  await executarSeed({ force: true, confirmar: naoDeviaPerguntar, log: silencioso });

  assert.ok((await Article.countDocuments({ parentType: 'ciclo', published: true })) >= 1);
});

test('--force e -f liberam a substituição; outros argumentos não', () => {
  assert.equal(pedeForce(['node', 'seed.ts', '--force']), true);
  assert.equal(pedeForce(['node', 'seed.ts', '-f']), true);
  assert.equal(pedeForce(['node', 'seed.ts']), false);
  assert.equal(pedeForce(['node', 'seed.ts', '--forca']), false);
});

test('só "s" ou "sim" confirmam; vazio (padrão N) e qualquer outra resposta recusam', () => {
  for (const sim of ['s', 'S', 'sim', ' Sim ']) assert.equal(respostaConfirma(sim), true, sim);
  for (const nao of ['', 'n', 'N', 'nao', 'y', 'yes', 'ss']) assert.equal(respostaConfirma(nao), false, nao);
});
