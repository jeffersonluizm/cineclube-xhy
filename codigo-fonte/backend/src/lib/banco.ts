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
export const DB_PATH_PADRAO = path.resolve(__dirname, '../../data/db');

export interface OpcoesConexao {
  uri?: string;
  producao?: boolean;
  portaEmbutida?: number;
  dbPath?: string;
  timeoutMs?: number;
  /**
   * Proíbe cair no banco embutido de desenvolvimento (porta 27018 ou backend/data/db).
   * Padrão: ligado quando CINECLUBE_PROIBIR_BANCO_DEV=1 (o npm test liga, ver test/preparar.ts).
   */
  proibirBancoDev?: boolean;
  /** De quanto em quanto tempo checar se outros clientes saíram antes de parar o embutido */
  intervaloEsperaMs?: number;
  log?: (mensagem: string) => void;
}

export interface ConexaoBanco {
  origem: 'configurado' | 'embutido-existente' | 'embutido-novo';
  /** host:porta/banco (configurado|embutido), sem usuário nem senha: para logs e perguntas */
  descricao: string;
  /**
   * Fecha a conexão e, se este processo subiu o banco embutido, para o banco (sem apagar os dados).
   * Se outros clientes (a API) estiverem conectados a esse embutido, espera eles saírem antes de parar:
   * o mongod morre junto com o processo que o iniciou, então não dá para deixá-lo rodando sozinho.
   */
  desconectar(): Promise<void>;
}

/**
 * Descreve o banco para o usuário sem expor credenciais: só os hosts da URI
 * (o que vem depois do último @) e o nome do banco.
 */
export function descreverBanco(uri: string, nomeBanco: string, tipo: 'configurado' | 'embutido'): string {
  const semEsquema = uri.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '');
  const autoridade = semEsquema.split(/[/?]/)[0];
  const hosts = autoridade.slice(autoridade.lastIndexOf('@') + 1);
  return `${hosts}/${nomeBanco} (${tipo})`;
}

/** Lança erro se a proteção estiver ligada e a conexão fosse usar o banco de desenvolvimento. */
export function checarBancoDev(porta: number, dbPath: string, proibido: boolean): void {
  if (!proibido) return;
  if (porta === PORTA_EMBUTIDA || path.resolve(dbPath) === DB_PATH_PADRAO) {
    throw new Error(
      `Uso do banco de desenvolvimento (porta ${PORTA_EMBUTIDA} ou ${DB_PATH_PADRAO}) proibido neste processo. ` +
        'Nos testes, passe portaEmbutida e dbPath próprios ou use producao: true.'
    );
  }
}

function portaOcupada(porta: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: '127.0.0.1', port: porta });
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('error', () => resolve(false));
  });
}

export async function conectarBanco(opcoes: OpcoesConexao = {}): Promise<ConexaoBanco> {
  const uri = opcoes.uri ?? process.env.MONGODB_URI ?? URI_PADRAO;
  const producao = opcoes.producao ?? process.env.NODE_ENV === 'production';
  const porta = opcoes.portaEmbutida ?? PORTA_EMBUTIDA;
  const dbPath = opcoes.dbPath ?? DB_PATH_PADRAO;
  const timeoutMs = opcoes.timeoutMs ?? 8000;
  const intervaloEsperaMs = opcoes.intervaloEsperaMs ?? 2000;
  const proibirBancoDev = opcoes.proibirBancoDev ?? process.env.CINECLUBE_PROIBIR_BANCO_DEV === '1';
  const log = opcoes.log ?? console.log;
  const soDesconectar = async () => {
    await mongoose.disconnect();
  };

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: timeoutMs });
    const descricao = descreverBanco(uri, mongoose.connection.name, 'configurado');
    log(`Conectado ao MongoDB ${descricao}`);
    return { origem: 'configurado', descricao, desconectar: soDesconectar };
  } catch (err) {
    log(`Não foi possível conectar ao MongoDB configurado: ${(err as Error).message}`);
    if (producao) throw err;
  }

  checarBancoDev(porta, dbPath, proibirBancoDev);

  if (await portaOcupada(porta)) {
    const uriEmbutido = `mongodb://127.0.0.1:${porta}/${NOME_BANCO}`;
    try {
      await mongoose.connect(uriEmbutido, { serverSelectionTimeoutMS: timeoutMs });
    } catch (err) {
      await mongoose.disconnect(); // para o driver de ficar tentando a porta
      throw new Error(
        `A porta ${porta} está ocupada por um programa que não é o MongoDB (ou que não respondeu como um). ` +
          `Feche esse programa ou defina MONGODB_URI. Detalhe: ${(err as Error).message}`
      );
    }
    const descricao = descreverBanco(uriEmbutido, NOME_BANCO, 'embutido');
    log(`Conectado ao MongoDB ${descricao}, que já estava rodando (API?)`);
    return { origem: 'embutido-existente', descricao, desconectar: soDesconectar };
  }

  // Fallback de desenvolvimento: MongoDB embutido com dados persistidos em disco
  log(`Iniciando MongoDB embutido de desenvolvimento (${dbPath})...`);
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  fs.mkdirSync(dbPath, { recursive: true });
  const mongod = await MongoMemoryServer.create({
    // portGeneration: false mantém a porta fixa, para o seed e a API se encontrarem
    instance: { dbName: NOME_BANCO, dbPath, storageEngine: 'wiredTiger', port: porta, portGeneration: false },
  });
  // appName único identifica as conexões deste processo entre os clientes do mongod
  const appName = `cineclube-xhy-${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
  await mongoose.connect(`${mongod.getUri()}${NOME_BANCO}`, { appName });
  const outrosClientes = async () => {
    const ops = await mongoose.connection
      .getClient()
      .db('admin')
      .aggregate([{ $currentOp: { allUsers: true, idleConnections: true } }])
      .toArray();
    return ops.filter((op) => op.client && op.appName !== appName).length;
  };
  const descricao = descreverBanco(mongod.getUri(), NOME_BANCO, 'embutido');
  log(`Conectado ao MongoDB ${descricao}, iniciado por este processo`);
  return {
    origem: 'embutido-novo',
    descricao,
    async desconectar() {
      if ((await outrosClientes()) > 0) {
        log(
          `Há outros clientes conectados ao MongoDB ${descricao} (provavelmente a API). ` +
            'Este processo iniciou o banco, então ele continua no ar até eles desconectarem. ' +
            'Pare a API antes de fechar esta janela, ou ela fica sem banco.'
        );
        while ((await outrosClientes()) > 0) {
          await new Promise((r) => setTimeout(r, intervaloEsperaMs));
        }
        log('Os outros clientes desconectaram; encerrando o banco embutido.');
      }
      // O stop encerra o mongod à força (no Windows não há desligamento limpo): sem o fsync,
      // as últimas gravações (como as do seed) podem se perder
      await mongoose.connection.db?.admin().command({ fsync: 1 });
      await mongoose.disconnect();
      // doCleanup apaga só diretório temporário; com dbPath próprio os dados ficam (force: false)
      await mongod.stop({ doCleanup: true, force: false });
    },
  };
}
