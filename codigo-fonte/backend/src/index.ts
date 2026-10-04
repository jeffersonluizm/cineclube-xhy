import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Antes de importar o app: as rotas leem variáveis de ambiente ao serem carregadas
dotenv.config();

import app from './app';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cineclube_xhy';

// Em produção, segredos precisam estar definidos — sem fallback silencioso
if (IS_PRODUCTION) {
  const missing = ['MONGODB_URI', 'ADMIN_PASSWORD', 'JWT_SECRET', 'FRONTEND_URL'].filter((k) => !process.env[k]);
  if (missing.length > 0) {
    console.error(`Variáveis de ambiente obrigatórias em produção não definidas: ${missing.join(', ')}`);
    process.exit(1);
  }
  if (!process.env.CLOUDINARY_URL) {
    console.warn(
      'AVISO: CLOUDINARY_URL não definida. Imagens serão salvas em disco local e podem ser perdidas a cada deploy.'
    );
  }
}

async function connectDatabase() {
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
    console.log('Conectado ao MongoDB');
    return;
  } catch (err) {
    console.error('Não foi possível conectar ao MongoDB configurado:', (err as Error).message);
    if (IS_PRODUCTION) throw err;
  }

  // Fallback de desenvolvimento: MongoDB embutido com dados persistidos em backend/data/
  console.log('Iniciando MongoDB embutido de desenvolvimento (backend/data)...');
  const fs = await import('fs');
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  const dbPath = path.resolve(__dirname, '../data/db');
  fs.mkdirSync(dbPath, { recursive: true });
  const mongod = await MongoMemoryServer.create({
    instance: { dbName: 'cineclube_xhy', dbPath, storageEngine: 'wiredTiger', port: 27018 },
  });
  await mongoose.connect(`${mongod.getUri()}cineclube_xhy`);
  console.log('Conectado ao MongoDB embutido em', mongod.getUri());
}

connectDatabase()
  .then(() => {
    app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
  })
  .catch((err) => {
    console.error('Erro ao conectar ao MongoDB:', err);
    process.exit(1);
  });

export default app;
