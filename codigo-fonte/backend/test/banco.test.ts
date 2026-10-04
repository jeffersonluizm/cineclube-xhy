import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import net from 'net';
import os from 'os';
import path from 'path';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { conectarBanco, descreverBanco } from '../src/lib/banco';
import { conectarSoNaUri } from './helpers/conexaoSegura';

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
  const mongod = await MongoMemoryServer.create({ instance: { launchTimeout: 60_000 } });
  try {
    const conexao = await conectarSoNaUri(`${mongod.getUri()}configurado`);

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
  const daApi = await MongoMemoryServer.create({ instance: { launchTimeout: 60_000 } });
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
    assert.equal(conexao.descricao, `127.0.0.1:${porta}/cineclube_xhy (embutido)`);
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
    assert.equal(primeira.descricao, `127.0.0.1:${porta}/cineclube_xhy (embutido)`);
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

test('descrição do banco mostra hosts e nome, sem usuário e senha', () => {
  assert.equal(
    descreverBanco('mongodb+srv://editor:s3nh4@cluster0.abc12.mongodb.net/cineclube_xhy?retryWrites=true', 'cineclube_xhy', 'configurado'),
    'cluster0.abc12.mongodb.net/cineclube_xhy (configurado)'
  );
  assert.equal(
    descreverBanco('mongodb://u%40x:p%3Aw@h1:27017,h2:27018/?replicaSet=rs0', 'outro', 'configurado'),
    'h1:27017,h2:27018/outro (configurado)'
  );
  assert.equal(descreverBanco('mongodb://localhost:27017/cineclube_xhy', 'cineclube_xhy', 'configurado'), 'localhost:27017/cineclube_xhy (configurado)');
});

test('URI configurada com usuário e senha: descrição e log não expõem as credenciais', async () => {
  const mongod = await MongoMemoryServer.create({
    instance: { launchTimeout: 60_000 },
    auth: { enable: true, customRootName: 'editorsecreto', customRootPwd: 'SenhaMuitoSecreta123' },
  });
  const linhas: string[] = [];
  try {
    const porta = mongod.instanceInfo!.port;
    const uri = `mongodb://editorsecreto:SenhaMuitoSecreta123@127.0.0.1:${porta}/cineclube_xhy?authSource=admin`;
    const conexao = await conectarSoNaUri(uri, { log: (l) => linhas.push(l) });

    assert.equal(conexao.descricao, `127.0.0.1:${porta}/cineclube_xhy (configurado)`);
    assert.ok(linhas.some((l) => l.includes(conexao.descricao)), 'o log de conexão mostra o banco');
    assert.doesNotMatch([conexao.descricao, ...linhas].join(' '), /editorsecreto|SenhaMuitoSecreta123/);
    await conexao.desconectar();
  } finally {
    await mongod.stop();
  }
});

test('porta do embutido ocupada por algo que não é MongoDB: erro diz isso claramente', async () => {
  const conexoes = new Set<net.Socket>();
  const intruso = net.createServer((socket) => {
    conexoes.add(socket);
    socket.on('error', () => {}); // o cliente pode derrubar a conexão
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
  });
  await new Promise<void>((r) => intruso.listen(0, '127.0.0.1', () => r()));
  const porta = (intruso.address() as net.AddressInfo).port;
  const dbPath = path.join(os.tmpdir(), `cineclube-nao-criar-${process.pid}`);
  try {
    await assert.rejects(
      conectarBanco({ uri: URI_FORA_DO_AR, producao: false, timeoutMs: 500, portaEmbutida: porta, dbPath, log: silencioso }),
      (err: Error) => {
        assert.match(err.message, new RegExp(`porta ${porta} está ocupada por um programa que não é o MongoDB`));
        return true;
      }
    );
    assert.equal(fs.existsSync(dbPath), false);
  } finally {
    for (const socket of conexoes) socket.destroy();
    await new Promise((r) => intruso.close(r));
  }
});

test('embutido iniciado por este processo continua no ar enquanto outro cliente (a API) estiver conectado', async () => {
  const porta = await portaLivre();
  const dbPath = fs.mkdtempSync(path.join(os.tmpdir(), 'cineclube-embutido-'));
  const linhas: string[] = [];
  const conexao = await conectarBanco({
    uri: URI_FORA_DO_AR,
    producao: false,
    timeoutMs: 300,
    portaEmbutida: porta,
    dbPath,
    intervaloEsperaMs: 100,
    log: (l) => linhas.push(l),
  });
  // A "API": outro cliente, com sua própria instância do mongoose
  const api = new mongoose.Mongoose();
  try {
    assert.equal(conexao.origem, 'embutido-novo');
    await api.connect(`mongodb://127.0.0.1:${porta}/cineclube_xhy`);

    let terminou = false;
    const desligando = conexao.desconectar().then(() => {
      terminou = true;
    });
    await new Promise((r) => setTimeout(r, 1000));

    assert.equal(terminou, false, 'não pode derrubar o banco com a API conectada');
    await api.connection.db!.collection('marcas').insertOne({ depois: true });
    assert.ok(linhas.some((l) => /outros clientes/i.test(l)), 'avisa no log');

    await api.disconnect();
    await desligando;
    assert.equal(terminou, true);
  } finally {
    await api.disconnect();
    await removerComPaciencia(dbPath);
  }
});

function portaRespondendo(porta: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: '127.0.0.1', port: porta });
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('error', () => resolve(false));
  });
}

test('se a checagem antes de parar falhar, o embutido iniciado aqui é parado mesmo assim', async () => {
  const porta = await portaLivre();
  const dbPath = fs.mkdtempSync(path.join(os.tmpdir(), 'cineclube-embutido-'));
  try {
    const conexao = await conectarBanco({
      uri: URI_FORA_DO_AR,
      producao: false,
      timeoutMs: 300,
      portaEmbutida: porta,
      dbPath,
      log: silencioso,
    });
    assert.equal(conexao.origem, 'embutido-novo');
    // Conexão fechada por fora: fsync e a contagem de clientes passam a lançar
    await mongoose.connection.close();

    await assert.rejects(conexao.desconectar());

    assert.equal(await portaRespondendo(porta), false, 'o mongod precisa ter sido parado');
  } finally {
    await removerComPaciencia(dbPath);
  }
});

test('aviso de espera pela API diz que Ctrl+C encerra o banco', async () => {
  const porta = await portaLivre();
  const dbPath = fs.mkdtempSync(path.join(os.tmpdir(), 'cineclube-embutido-'));
  const linhas: string[] = [];
  const api = new mongoose.Mongoose();
  try {
    const conexao = await conectarBanco({
      uri: URI_FORA_DO_AR,
      producao: false,
      timeoutMs: 300,
      portaEmbutida: porta,
      dbPath,
      intervaloEsperaMs: 100,
      log: (l) => linhas.push(l),
    });
    await api.connect(`mongodb://127.0.0.1:${porta}/cineclube_xhy`);
    const desligando = conexao.desconectar();
    await new Promise((r) => setTimeout(r, 500));
    await api.disconnect();
    await desligando;

    assert.ok(linhas.some((l) => /outros clientes/i.test(l) && /Ctrl\+C/.test(l)), linhas.join('\n'));
  } finally {
    await api.disconnect();
    await removerComPaciencia(dbPath);
  }
});
