import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

/** Sobe um MongoDB só em memória (nunca backend/data/db) e conecta o mongoose nele. */
export async function abrirBancoEmMemoria() {
  // launchTimeout folgado: com a máquina ocupada o mongod pode levar mais de 10 s para subir
  const mongod = await MongoMemoryServer.create({ instance: { launchTimeout: 60_000 } });
  await mongoose.connect(mongod.getUri(), { dbName: 'teste' });
  // Índices (únicos, de texto) prontos antes do primeiro teste, como em produção
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
  return {
    uri: mongod.getUri(),
    /** Esvazia as coleções mantendo os índices (dropDatabase apagaria os únicos) */
    async limpar() {
      const colecoes = await mongoose.connection.db!.collections();
      await Promise.all(colecoes.map((c) => c.deleteMany({})));
    },
    async fechar() {
      await mongoose.disconnect();
      await mongod.stop();
    },
  };
}
