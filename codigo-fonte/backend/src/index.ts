import dotenv from 'dotenv';

// Antes de importar o app: as rotas leem variáveis de ambiente ao serem carregadas
dotenv.config();

import app from './app';
import { conectarBanco } from './lib/banco';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3001;

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

// MONGODB_TIMEOUT_MS: prazo para achar o banco (padrão 8 s); maior ajuda com Atlas acordando ou máquina ocupada
conectarBanco({ timeoutMs: Number(process.env.MONGODB_TIMEOUT_MS) || undefined })
  .then(() => {
    app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
  })
  .catch((err) => {
    console.error('Erro ao conectar ao MongoDB:', err);
    process.exit(1);
  });

export default app;
