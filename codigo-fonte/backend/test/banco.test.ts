import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import net from 'net';
import os from 'os';
import path from 'path';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { conectarBanco } from '../src/lib/banco';

// Porta onde nada escuta: a "URI configurada" que não responde
const URI_FORA_DO_AR = 'mongodb://127.0.0.1:1/cineclube_xhy';
const silencioso = () => {};

afterEach(async () => {
  await mongoose.disconnect();
});

function portaLivre(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.once('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address() as net.AddressInfo;
      srv.close(() => resolve(port));
    });
  });
}

// No Windows o mongod pode segurar os arquivos por alguns instantes depois de parar
async function removerComPaciencia(dir: string) {
  for (let tentativa = 1; ; tentativa++) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
      return;
    } catch (err) {
      if (tentativa >= 40) throw err;
      await new Promise((r) => setTimeout(r, 250));
    }
  }
}

test('conecta na URI configurada quando ela responde', async () => {
  const mongod = await MongoMemoryServer.create();
  try {
    const conexao = await conectarBanco({ uri: `${mongod.getUri()}configurado`, producao: false, log: silencioso });

    assert.equal(conexao.origem, 'configurado');
    assert.equal(mongoose.connection.readyState, 1);
    assert.equal(mongoose.connection.name, 'configurado');
    await conexao.desconectar();
  } finally {
    await mongod.stop();
  }
});

test('em produção, URI fora do ar é erro e não sobe banco embutido', async () => {
  const dbPath = path.join(os.tmpdir(), `cineclube-nao-criar-${process.pid}`);

  await assert.rejects(
    conectarBanco({ uri: URI_FORA_DO_AR, producao: true, timeoutMs: 300, dbPath, log: silencioso })
  );
  assert.equal(fs.existsSync(dbPath), false);
});

test('fora de produção, se o banco embutido já está na porta (API rodando), conecta nele', async () => {
  const daApi = await MongoMemoryServer.create();
  const porta = daApi.instanceInfo!.port;
  const dbPath = path.join(os.tmpdir(), `cineclube-nao-criar-${process.pid}`);
  try {
    const conexao = await conectarBanco({
      uri: URI_FORA_DO_AR,
      producao: false,
      timeoutMs: 300,
      portaEmbutida: porta,
      dbPath,
      log: silencioso,
    });

    assert.equal(conexao.origem, 'embutido-existente');
    assert.equal(mongoose.connection.port, porta);
    assert.equal(mongoose.connection.name, 'cineclube_xhy');
    assert.equal(fs.existsSync(dbPath), false, 'não deve subir outro banco');

    await conexao.desconectar();
    assert.equal(daApi.state, 'running', 'desconectar não pode derrubar o banco da API');
  } finally {
    await daApi.stop();
  }
});

test('fora de produção, sem banco na porta, sobe o embutido no dbPath e mantém os dados ao desconectar', async () => {
  const porta = await portaLivre();
  const dbPath = fs.mkdtempSync(path.join(os.tmpdir(), 'cineclube-embutido-'));
  const opcoes = { uri: URI_FORA_DO_AR, producao: false, timeoutMs: 300, portaEmbutida: porta, dbPath, log: silencioso };
  try {
    const primeira = await conectarBanco(opcoes);
    assert.equal(primeira.origem, 'embutido-novo');
    assert.equal(mongoose.connection.port, porta);
    await mongoose.connection.db!.collection('marcas').insertOne({ ok: 1 });
    await primeira.desconectar();

    const segunda = await conectarBanco(opcoes);
    assert.equal(segunda.origem, 'embutido-novo');
    assert.equal(await mongoose.connection.db!.collection('marcas').countDocuments(), 1);
    await segunda.desconectar();
  } finally {
    await removerComPaciencia(dbPath);
  }
});
