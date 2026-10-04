import fs from 'fs';
import net from 'net';
import path from 'path';
import mongoose from 'mongoose';

/**
 * Conexão com o MongoDB compartilhada pela API (index.ts) e pelo seed (scripts/seed.ts),
 * para que os dois sempre usem o mesmo banco:
 *  1. MONGODB_URI (ou o MongoDB local padrão em localhost:27017);
 *  2. fora de produção, se ele não responder, o banco embutido de desenvolvimento,
 *     com dados em backend/data/db e porta fixa 27018: se a porta já estiver ocupada
 *     (API rodando com o embutido), conecta nele; senão, sobe o embutido.
 */

export const NOME_BANCO = 'cineclube_xhy';
export const PORTA_EMBUTIDA = 27018;
const URI_PADRAO = `mongodb://localhost:27017/${NOME_BANCO}`;
// src/lib e dist/lib ficam no mesmo nível: os dois apontam para backend/data/db
const DB_PATH_PADRAO = path.resolve(__dirname, '../../data/db');

export interface OpcoesConexao {
  uri?: string;
  producao?: boolean;
  portaEmbutida?: number;
  dbPath?: string;
  timeoutMs?: number;
  log?: (mensagem: string) => void;
}

export interface ConexaoBanco {
  origem: 'configurado' | 'embutido-existente' | 'embutido-novo';
  /** Fecha a conexão e, se este processo subiu o banco embutido, para o banco (sem apagar os dados). */
  desconectar(): Promise<void>;
}

function portaOcupada(porta: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: '127.0.0.1', port: porta });
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('error', () => resolve(false));
  });
}

export async function conectarBanco(opcoes: OpcoesConexao = {}): Promise<ConexaoBanco> {
  const uri = opcoes.uri ?? process.env.MONGODB_URI ?? URI_PADRAO;
  const producao = opcoes.producao ?? process.env.NODE_ENV === 'production';
  const porta = opcoes.portaEmbutida ?? PORTA_EMBUTIDA;
  const dbPath = opcoes.dbPath ?? DB_PATH_PADRAO;
  const timeoutMs = opcoes.timeoutMs ?? 8000;
  const log = opcoes.log ?? console.log;
  const soDesconectar = async () => {
    await mongoose.disconnect();
  };

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: timeoutMs });
    log('Conectado ao MongoDB');
    return { origem: 'configurado', desconectar: soDesconectar };
  } catch (err) {
    log(`Não foi possível conectar ao MongoDB configurado: ${(err as Error).message}`);
    if (producao) throw err;
  }

  if (await portaOcupada(porta)) {
    await mongoose.connect(`mongodb://127.0.0.1:${porta}/${NOME_BANCO}`, { serverSelectionTimeoutMS: timeoutMs });
    log(`Conectado ao MongoDB embutido que já estava rodando na porta ${porta}`);
    return { origem: 'embutido-existente', desconectar: soDesconectar };
  }

  // Fallback de desenvolvimento: MongoDB embutido com dados persistidos em disco
  log(`Iniciando MongoDB embutido de desenvolvimento (${dbPath})...`);
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  fs.mkdirSync(dbPath, { recursive: true });
  const mongod = await MongoMemoryServer.create({
    // portGeneration: false mantém a porta fixa, para o seed e a API se encontrarem
    instance: { dbName: NOME_BANCO, dbPath, storageEngine: 'wiredTiger', port: porta, portGeneration: false },
  });
  await mongoose.connect(`${mongod.getUri()}${NOME_BANCO}`);
  log(`Conectado ao MongoDB embutido em ${mongod.getUri()}`);
  return {
    origem: 'embutido-novo',
    async desconectar() {
      // O stop encerra o mongod à força (no Windows não há desligamento limpo): sem o fsync,
      // as últimas gravações (como as do seed) podem se perder
      await mongoose.connection.db?.admin().command({ fsync: 1 });
      await mongoose.disconnect();
      // doCleanup apaga só diretório temporário; com dbPath próprio os dados ficam (force: false)
      await mongod.stop({ doCleanup: true, force: false });
    },
  };
}
