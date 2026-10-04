import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';

import revistaRouter from './routes/revista';
import catalogosRouter from './routes/catalogos';
import ciclosRouter from './routes/ciclos';
import sobreRouter from './routes/sobre';
import homeRouter from './routes/home';
import authRouter from './routes/auth';
import uploadRouter from './routes/upload';
import adminRouter from './routes/admin';

// Só monta o app: a conexão com o banco e o listen ficam em index.ts (os testes importam este módulo)
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

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

export default app;
