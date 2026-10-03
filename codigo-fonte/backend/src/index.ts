import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

import revistaRouter from './routes/revista';
import catalogosRouter from './routes/catalogos';
import ciclosRouter from './routes/ciclos';
import sobreRouter from './routes/sobre';
import homeRouter from './routes/home';
import authRouter from './routes/auth';
import uploadRouter from './routes/upload';
import adminRouter from './routes/admin';

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

const app = express();

// Atrás de proxy (Render, Vercel, etc.) para o IP real chegar ao rate limit
if (IS_PRODUCTION) app.set('trust proxy', 1);

// FRONTEND_URL aceita várias origens separadas por vírgula
// (ex.: https://cineclubexhy.com.br,https://www.cineclubexhy.com.br)
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Requisições sem Origin (curl, health checks, server-to-server) são permitidas
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`Origem não permitida pelo CORS: ${origin}`));
    },
  })
);
app.use(express.json({ limit: '2mb' }));

// Imagens enviadas pelo editor (apenas quando o Cloudinary não está configurado)
app.use(
  '/uploads',
  express.static(path.resolve(__dirname, '../uploads'), {
    maxAge: IS_PRODUCTION ? '30d' : 0,
    immutable: IS_PRODUCTION,
  })
);

app.use('/api/home', homeRouter);
app.use('/api/revista', revistaRouter);
app.use('/api/catalogos', catalogosRouter);
app.use('/api/ciclos', ciclosRouter);
app.use('/api/sobre', sobreRouter);
app.use('/api/auth', authRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/admin', adminRouter);

app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' })
);
app.get('/', (_req, res) => res.json({ name: 'Cineclube XHY API', status: 'ok' }));

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
