import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import Magazine from '../src/models/Magazine';
import Article from '../src/models/Article';
import About from '../src/models/About';
import { executarSeed, pedeForce, respostaConfirma, codigoDeSaida, MENSAGEM_SEM_TERMINAL } from '../src/scripts/seed';
import { abrirBancoEmMemoria } from './helpers/bancoEmMemoria';

let banco: Awaited<ReturnType<typeof abrirBancoEmMemoria>>;
const silencioso = () => {};
const BANCO = '127.0.0.1:27018/cineclube_xhy (embutido)';
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
    banco: BANCO,
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

  const resultado = await executarSeed({ banco: BANCO, force: false, confirmar: async () => true, log: silencioso });

  assert.equal(resultado, 'aplicado');
  const revistas = await Magazine.find();
  assert.deepEqual(revistas.map((r) => r.number).sort(), [1, 2]);
});

test('com --force, substitui sem perguntar', async () => {
  await criarRevistaDoEditor();

  const resultado = await executarSeed({ banco: BANCO, force: true, confirmar: naoDeviaPerguntar, log: silencioso });

  assert.equal(resultado, 'aplicado');
  assert.equal(await Magazine.countDocuments({ number: 99 }), 0);
});

test('banco vazio é populado sem perguntar', async () => {
  const resultado = await executarSeed({ banco: BANCO, force: false, confirmar: naoDeviaPerguntar, log: silencioso });

  assert.equal(resultado, 'aplicado');
  assert.equal(await Magazine.countDocuments(), 2);
});

test('equipe do Sobre usa nomes e contatos fictícios', async () => {
  await executarSeed({ banco: BANCO, force: true, confirmar: naoDeviaPerguntar, log: silencioso });

  const sobre = await About.findOne();
  assert.ok(sobre && sobre.team.length > 0);
  for (const membro of sobre.team) {
    assert.match(membro.email ?? '', /@exemplo\.com$/, membro.email);
  }
  assert.doesNotMatch(JSON.stringify(sobre.team), /ufpe|prysthon|nicoleli|barros/i);
});

test('dados de exemplo trazem um texto publicado de ciclo', async () => {
  await executarSeed({ banco: BANCO, force: true, confirmar: naoDeviaPerguntar, log: silencioso });

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

test('a pergunta de confirmação diz em qual banco os dados serão apagados', async () => {
  await criarRevistaDoEditor();
  const perguntas: string[] = [];

  await executarSeed({
    banco: 'cluster0.abc12.mongodb.net/cineclube_xhy (configurado)',
    force: false,
    confirmar: async (pergunta) => {
      perguntas.push(pergunta);
      return false;
    },
    log: silencioso,
  });

  assert.equal(perguntas.length, 1);
  assert.match(perguntas[0], /^O banco cluster0\.abc12\.mongodb\.net\/cineclube_xhy \(configurado\) já tem 1 documento\(s\)/);
});

test('cancelar por escolha sai com 0; recusar por falta de terminal sai com 1', () => {
  assert.equal(codigoDeSaida('aplicado', true), 0);
  assert.equal(codigoDeSaida('aplicado', false), 0);
  assert.equal(codigoDeSaida('cancelado', true), 0);
  assert.equal(codigoDeSaida('cancelado', false), 1);
});

test('sem terminal interativo, a mensagem orienta como confirmar (Git Bash, winpty, --force)', () => {
  assert.match(MENSAGEM_SEM_TERMINAL, /Git Bash/);
  assert.match(MENSAGEM_SEM_TERMINAL, /cmd/);
  assert.match(MENSAGEM_SEM_TERMINAL, /PowerShell/);
  assert.match(MENSAGEM_SEM_TERMINAL, /winpty npm run seed/);
  assert.match(MENSAGEM_SEM_TERMINAL, /npm run seed -- --force/);
});

test('dados de exemplo não têm cascas vazias: toda revista, catálogo e exibição tem conteúdo coerente', async () => {
  const { default: Catalog } = await import('../src/models/Catalog');
  const { default: Cycle } = await import('../src/models/Cycle');
  const { default: Film } = await import('../src/models/Film');
  const fs = await import('node:fs');
  const path = await import('node:path');
  await executarSeed({ banco: BANCO, force: true, confirmar: naoDeviaPerguntar, log: silencioso });

  const revistas = await Magazine.find().lean();
  assert.ok(revistas.length >= 2, 'mais de uma edição da revista');
  for (const r of revistas) {
    assert.ok((await Article.countDocuments({ parentType: 'revista', parentId: r._id })) >= 2, `revista n°${r.number} com textos`);
  }
  for (const c of await Catalog.find().lean()) {
    assert.ok((await Article.countDocuments({ parentType: 'catalogo', parentId: c._id })) >= 1, `catálogo ${c.slug} com texto`);
    assert.ok(c.description, `catálogo ${c.slug} com descrição`);
  }
  const ciclos = await Cycle.find().lean();
  assert.ok(ciclos.length >= 2);
  for (const c of ciclos) {
    const filmes = await Film.find({ cycleId: c._id }).lean();
    assert.ok(filmes.length >= 1, `exibição ${c.slug} com filmes`);
    assert.ok((c.screenings ?? []).length >= 1, `exibição ${c.slug} com programação`);
    assert.ok(c.description, `exibição ${c.slug} com descrição`);
    const slugs = new Set(filmes.map((f) => f.slug));
    for (const s of c.screenings ?? []) {
      if (s.filmSlug) assert.ok(slugs.has(s.filmSlug), `sessão ${s.filmTitle} aponta para um filme da própria exibição`);
    }
  }
  const capas = [...revistas, ...(await Catalog.find().lean()), ...ciclos].map((d) => d.coverImage).filter(Boolean) as string[];
  for (const capa of capas) {
    assert.match(capa, /^\/demo\/[\w-]+\.png$/);
    assert.ok(fs.existsSync(path.resolve(__dirname, '../demo-imagens', path.basename(capa))), `${capa} existe`);
  }
});
