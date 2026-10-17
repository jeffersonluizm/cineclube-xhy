// Backup e restauração do banco (npm run backup / npm run restaurar), só com banco em memória
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { fazerBackup, pastaDoBackup } from '../src/scripts/backup';
import { restaurarBackup } from '../src/scripts/restaurar';

let mongod: MongoMemoryServer;
let base: string;
const uriDo = (banco: string) => `${mongod.getUri()}${banco}`;

before(async () => {
  mongod = await MongoMemoryServer.create({ instance: { launchTimeout: 60_000 } });
  base = fs.mkdtempSync(path.join(os.tmpdir(), 'cineclube-backup-'));
  const cliente = new mongoose.mongo.MongoClient(uriDo('origem'));
  await cliente.connect();
  const db = cliente.db('origem');
  const revistaId = new mongoose.Types.ObjectId();
  await db.collection('magazines').insertOne({
    _id: revistaId,
    number: 1,
    slug: 'n1',
    createdAt: new Date('2026-10-01T12:34:56.789Z'),
  });
  await db.collection('articles').insertMany([
    { title: 'Texto A', parentId: revistaId, blocks: [{ type: 'paragraph', text: 'oi' }], updatedAt: new Date('2026-10-02T00:00:00Z') },
    { title: 'Texto B', parentId: revistaId, order: 2, nota: 3.5 },
  ]);
  await db.collection('demo_meta').insertOne({ _id: 'reset' as never, ultimoReset: new Date('2026-10-03T00:00:00Z') });
  await cliente.close();
});
after(async () => {
  await mongod?.stop();
  await fs.promises.rm(base, { recursive: true, force: true });
});

async function documentos(banco: string) {
  const cliente = new mongoose.mongo.MongoClient(uriDo(banco));
  await cliente.connect();
  try {
    const db = cliente.db(banco);
    const saida: Record<string, unknown[]> = {};
    for (const { name } of await db.listCollections().toArray()) {
      saida[name] = await db.collection(name).find().sort({ _id: 1 }).toArray();
    }
    return saida;
  } finally {
    await cliente.close();
  }
}

test('pasta do backup é datada', () => {
  assert.match(pastaDoBackup('/b', new Date('2026-10-17T09:05:00')), /2026-10-17-0905$/);
});

test('ida e volta preserva documentos, ids (ObjectId) e datas (Date)', async () => {
  const destino = path.join(base, 'ida-e-volta');
  const logs: string[] = [];
  const resumo = await fazerBackup({ uri: uriDo('origem'), destino, log: (m) => logs.push(m) });
  assert.deepEqual(resumo.colecoes, { articles: 2, demo_meta: 1, magazines: 1 });
  for (const nome of ['articles.json', 'magazines.json', 'demo_meta.json', 'manifesto.json']) {
    assert.ok(fs.existsSync(path.join(destino, nome)), nome);
  }

  await restaurarBackup({ uri: uriDo('copia'), origem: destino, log: (m) => logs.push(m) });
  const original = await documentos('origem');
  const copia = await documentos('copia');
  assert.deepEqual(copia, original);
  const artigo = copia.articles[0] as { _id: unknown; parentId: unknown; updatedAt: unknown };
  assert.ok(artigo._id instanceof mongoose.mongo.ObjectId, 'o _id continua ObjectId');
  assert.ok(artigo.parentId instanceof mongoose.mongo.ObjectId, 'a referência continua ObjectId');
  assert.ok(artigo.updatedAt instanceof Date, 'a data continua Date');
});

test('restaurar sobre um banco com conteúdo é recusado sem a confirmação, e nada muda', async () => {
  const destino = path.join(base, 'recusa');
  await fazerBackup({ uri: uriDo('origem'), destino, log: () => {} });
  const cliente = new mongoose.mongo.MongoClient(uriDo('alvo-cheio'));
  await cliente.connect();
  await cliente.db('alvo-cheio').collection('magazines').insertOne({ number: 99, slug: 'do-cliente' });
  await cliente.close();

  await assert.rejects(restaurarBackup({ uri: uriDo('alvo-cheio'), origem: destino, log: () => {} }), /já tem conteúdo.*--substituir/);
  assert.deepEqual(
    (await documentos('alvo-cheio')).magazines.map((m) => (m as { slug: string }).slug),
    ['do-cliente']
  );

  await restaurarBackup({ uri: uriDo('alvo-cheio'), origem: destino, substituir: true, log: () => {} });
  assert.deepEqual(await documentos('alvo-cheio'), await documentos('origem'));
});

test('os logs não mostram a URI do banco (que em produção traz usuário e senha)', async () => {
  const logs: string[] = [];
  const destino = path.join(base, 'logs');
  await fazerBackup({ uri: uriDo('origem'), destino, log: (m) => logs.push(m) });
  await restaurarBackup({ uri: uriDo('logs-alvo'), origem: destino, log: (m) => logs.push(m) });
  assert.ok(logs.length > 0);
  for (const l of logs) assert.doesNotMatch(l, /mongodb(\+srv)?:\/\//, l);
});

test('pasta sem manifesto não é aceita como backup', async () => {
  const vazia = fs.mkdtempSync(path.join(base, 'sem-manifesto-'));
  await assert.rejects(restaurarBackup({ uri: uriDo('nada'), origem: vazia, log: () => {} }), /manifesto/);
});
