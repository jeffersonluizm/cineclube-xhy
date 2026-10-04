import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Magazine from '../src/models/Magazine';
import { conectarSoNaUri } from './helpers/conexaoSegura';
import { executarSeed } from '../src/scripts/seed';

test('pergunta do seed, num banco com usuário e senha, mostra o banco sem as credenciais', async () => {
  const mongod = await MongoMemoryServer.create({
    instance: { launchTimeout: 60_000 },
    auth: { enable: true, customRootName: 'editorsecreto', customRootPwd: 'SenhaMuitoSecreta123' },
  });
  try {
    const porta = mongod.instanceInfo!.port;
    const uri = `mongodb://editorsecreto:SenhaMuitoSecreta123@127.0.0.1:${porta}/cineclube_xhy?authSource=admin`;
    const conexao = await conectarSoNaUri(uri);
    await Magazine.create({ number: 99, volume: 3, month: 'maio', year: 2027, slug: 'n99' });
    const perguntas: string[] = [];

    try {
      await executarSeed({
        banco: conexao.descricao,
        force: false,
        confirmar: async (pergunta) => {
          perguntas.push(pergunta);
          return false;
        },
        log: () => {},
      });
    } finally {
      await conexao.desconectar();
    }

    assert.equal(perguntas.length, 1);
    assert.ok(perguntas[0].includes(`127.0.0.1:${porta}/cineclube_xhy (configurado)`), perguntas[0]);
    assert.doesNotMatch(perguntas[0], /editorsecreto|SenhaMuitoSecreta123/);
  } finally {
    await mongod.stop();
  }
});
