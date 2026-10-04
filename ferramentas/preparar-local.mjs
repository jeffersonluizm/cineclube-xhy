// Prepara a configuração local na primeira execução (chamado pelo iniciar.bat).
// Idempotente: só cria o que falta, nunca sobrescreve um .env existente.
//  - codigo-fonte/backend/.env        senha do editor, JWT_SECRET e SERVIDOR_SEGREDO fortes e
//                                     aleatórios, modo demonstração ligado
//  - codigo-fonte/frontend/.env.local endereço da API e o mesmo SERVIDOR_SEGREDO
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envApi = path.join(raiz, 'codigo-fonte/backend/.env');
const envSite = path.join(raiz, 'codigo-fonte/frontend/.env.local');
const aleatorio = (bytes, formato = 'hex') => crypto.randomBytes(bytes).toString(formato);

function lerVariavel(arquivo, nome) {
  if (!fs.existsSync(arquivo)) return undefined;
  const linha = fs
    .readFileSync(arquivo, 'utf8')
    .split(/\r?\n/)
    .find((l) => l.startsWith(`${nome}=`));
  return linha ? linha.slice(nome.length + 1).trim() : undefined;
}

let segredoServidor = lerVariavel(envApi, 'SERVIDOR_SEGREDO');

if (fs.existsSync(envApi)) {
  console.log('[ok] codigo-fonte/backend/.env já existe (mantido como está)');
} else {
  segredoServidor = aleatorio(32);
  const conteudo = [
    '# Gerado pelo iniciar.bat na primeira execução. Não versionar (está no .gitignore).',
    '# Sem MONGODB_URI, a API usa o MongoDB local ou sobe o banco embutido em backend/data/db.',
    'PORT=3001',
    'NODE_ENV=development',
    `ADMIN_PASSWORD=${aleatorio(12, 'base64url')}`,
    `JWT_SECRET=${aleatorio(32)}`,
    `SERVIDOR_SEGREDO=${segredoServidor}`,
    'FRONTEND_URL=http://localhost:3000',
    '# Modo demonstração: botão "Entrar no painel como editor de demonstração" e dados de exemplo',
    '# Localmente o reset periódico fica desligado (DEMO_RESET_MINUTOS=0) para não apagar seus dados.',
    'DEMO_ENABLED=true',
    'DEMO_RESET_MINUTOS=0',
    '',
  ].join('\n');
  fs.writeFileSync(envApi, conteudo);
  console.log('[criado] codigo-fonte/backend/.env com segredos aleatórios e modo demonstração ligado');
}

if (fs.existsSync(envSite)) {
  console.log('[ok] codigo-fonte/frontend/.env.local já existe (mantido como está)');
} else {
  const conteudo = [
    '# Gerado pelo iniciar.bat na primeira execução. Não versionar.',
    'NEXT_PUBLIC_API_URL=http://localhost:3001',
    'NEXT_PUBLIC_SITE_URL=http://localhost:3000',
    `SERVIDOR_SEGREDO=${segredoServidor ?? ''}`,
    '',
  ].join('\n');
  fs.writeFileSync(envSite, conteudo);
  console.log('[criado] codigo-fonte/frontend/.env.local');
}
