// Reset atômico da demonstração: num replica set (como o Atlas M0), falha no meio não deixa o
// banco pela metade; e as imagens enviadas são apagadas mesmo se o seed falhar.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import Magazine from '../src/models/Magazine';
import { restaurarDemonstracao, emReplicaSet } from '../src/lib/demo';
import { executarSeed } from '../src/scripts/seed';

let rs: MongoMemoryReplSet;
let pasta: string;
before(async () => {
  rs = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' }, instanceOpts: [{ launchTimeout: 60_000 }] });
  await mongoose.connect(rs.getUri(), { dbName: 'teste_transacao' });
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
  pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'cineclube-demo-transacao-'));
});
after(async () => {
  await mongoose.disconnect();
  await rs?.stop();
  await fs.promises.rm(pasta, { recursive: true, force: true });
});

const silencioso = () => {};

test('o banco de teste é um replica set (transações disponíveis)', async () => {
  assert.equal(await emReplicaSet(), true);
});

test('seed que falha no meio: a transação desfaz tudo, os dados antigos ficam e os uploads são apagados', async () => {
  await executarSeed({ banco: 'teste', force: true, confirmar: async () => true, log: silencioso });
  const antes = await Magazine.countDocuments();
  fs.mkdirSync(path.join(pasta, 'demo'), { recursive: true });
  fs.writeFileSync(path.join(pasta, 'demo', 'x.png'), 'x');

  const seedQuebrado = async () => {
    await Magazine.deleteMany({});
    await Magazine.create({ number: 1, volume: 1, month: 'maio', year: 2026, slug: 'meio-caminho' });
    throw new Error('falha simulada no meio do seed');
  };
  await assert.rejects(restaurarDemonstracao({ soSeVazio: false, log: silencioso, pasta, seed: seedQuebrado }), /falha simulada/);

  assert.equal(await Magazine.countDocuments(), antes, 'nada da metade do seed ficou');
  assert.equal(await Magazine.countDocuments({ slug: 'meio-caminho' }), 0);
  assert.equal(fs.existsSync(path.join(pasta, 'demo')), false, 'uploads apagados mesmo com o seed falhando');
});

test('seed completo dentro da transação: sem erro de chave duplicada ao recriar os mesmos slugs', async () => {
  await restaurarDemonstracao({ soSeVazio: false, log: silencioso, pasta });
  await restaurarDemonstracao({ soSeVazio: false, log: silencioso, pasta });
  assert.ok((await Magazine.countDocuments()) >= 2);
});
