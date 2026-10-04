import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

/** Sobe um MongoDB só em memória (nunca backend/data/db) e conecta o mongoose nele. */
export async function abrirBancoEmMemoria() {
  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri(), { dbName: 'teste' });
  return {
    uri: mongod.getUri(),
    async limpar() {
      await mongoose.connection.db!.dropDatabase();
    },
    async fechar() {
      await mongoose.disconnect();
      await mongod.stop();
    },
  };
}
