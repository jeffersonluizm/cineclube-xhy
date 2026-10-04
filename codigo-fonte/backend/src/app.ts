import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import mongoose from 'mongoose';

import revistaRouter from './routes/revista';
import catalogosRouter from './routes/catalogos';
import ciclosRouter from './routes/ciclos';
import sobreRouter from './routes/sobre';
import homeRouter from './routes/home';
import authRouter from './routes/auth';
import uploadRouter from './routes/upload';
import adminRouter from './routes/admin/index';
import descobertaRouter from './routes/descoberta';
import demoRouter from './routes/demo';
import { ErroHttp, rotaInexistente, tratadorDeErros } from './middleware/erros';
import { criarLimitadorGeral } from './middleware/limitadores';
import { pastaUploads } from './lib/uploads';

// Só monta o app: a conexão com o banco e o listen ficam em index.ts (os testes importam este módulo)
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const app = express();
app.disable('x-powered-by');
// Query string simples (node:querystring): a API não aceita objetos aninhados na URL, e isso
// também tira do caminho o parser qs (advisories de DoS ainda sem correção no Express 4)
app.set('query parser', 'simple');

// Atrás de proxy (Render, Vercel, etc.) para o IP real chegar ao rate limit
if (IS_PRODUCTION) app.set('trust proxy', 1);

// Cabeçalhos de segurança. A API só devolve JSON e imagens: nada pode ser executado
// nem embutido em frame; as imagens de /uploads são lidas pelo site em outra origem.
app.use(
  helmet({
    contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

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
      callback(new ErroHttp(403, `Origem não permitida pelo CORS: ${origin}`));
    },
    // O login mostra quanto falta para tentar de novo depois do limite (429)
    exposedHeaders: ['RateLimit', 'RateLimit-Policy', 'Retry-After'],
  })
);
app.use('/api', criarLimitadorGeral(Number(process.env.RATE_LIMIT_GERAL ?? 300)));
app.use(express.json({ limit: '2mb' }));

// Imagens enviadas pelo editor (apenas quando o Cloudinary não está configurado)
app.use(
  '/uploads',
  express.static(pastaUploads(), {
    maxAge: IS_PRODUCTION ? '30d' : 0,
    immutable: IS_PRODUCTION,
  })
);

// Capas dos dados de demonstração (geradas por demo-imagens/gerar-capas.mjs, sem material de terceiros)
app.use('/demo', express.static(path.resolve(__dirname, '../demo-imagens'), { maxAge: IS_PRODUCTION ? '7d' : 0 }));

app.use('/api/home', homeRouter);
app.use('/api/revista', revistaRouter);
app.use('/api/catalogos', catalogosRouter);
app.use('/api/ciclos', ciclosRouter);
app.use('/api/sobre', sobreRouter);
app.use('/api/auth', authRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/admin', adminRouter);
app.use('/api/demo', demoRouter);
app.use('/api', descobertaRouter);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }));
app.get('/', (_req, res) => res.json({ name: 'Cineclube XHY API', status: 'ok' }));

app.use('/api', rotaInexistente);
app.use(tratadorDeErros);

export default app;
