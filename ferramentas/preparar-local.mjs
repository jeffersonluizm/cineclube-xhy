// Prepara a configuração local na primeira execução (chamado pelo iniciar.bat).
// Idempotente: só cria o que falta, nunca sobrescreve um valor existente.
//  - codigo-fonte/backend/.env        senha do editor, JWT_SECRET e SERVIDOR_SEGREDO fortes e
//                                     aleatórios, modo demonstração ligado
//  - codigo-fonte/frontend/.env.local endereço da API e o mesmo SERVIDOR_SEGREDO
// O SERVIDOR_SEGREDO precisa ser igual nos dois: vem do arquivo que já o tiver; se nenhum
// tiver, é gerado. Arquivo existente sem a variável ganha só essa linha no fim.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const aleatorio = (bytes, formato = 'hex') => crypto.randomBytes(bytes).toString(formato);

export function lerVariavel(arquivo, nome) {
  if (!fs.existsSync(arquivo)) return undefined;
  const linha = fs
    .readFileSync(arquivo, 'utf8')
    .split(/\r?\n/)
    .find((l) => l.startsWith(`${nome}=`));
  const valor = linha ? linha.slice(nome.length + 1).trim() : undefined;
  return valor || undefined;
}

function acrescentarLinha(arquivo, linha) {
  const atual = fs.readFileSync(arquivo, 'utf8');
  const quebra = atual.includes('\r\n') ? '\r\n' : '\n';
  fs.writeFileSync(arquivo, atual + (atual === '' || atual.endsWith('\n') ? '' : quebra) + linha + quebra);
}

export function prepararAmbiente({ envApi, envSite, log = console.log }) {
  const daApi = lerVariavel(envApi, 'SERVIDOR_SEGREDO');
  const doSite = lerVariavel(envSite, 'SERVIDOR_SEGREDO');
  const segredo = daApi ?? doSite ?? aleatorio(32);
  if (daApi && doSite && daApi !== doSite) {
    log(
      '[aviso] SERVIDOR_SEGREDO diferente na API e no site: o site vai cair no limite por IP da API. ' +
        'Copie o valor do backend/.env para o frontend/.env.local.'
    );
  }

  if (!fs.existsSync(envApi)) {
    const conteudo = [
      '# Gerado pelo iniciar.bat na primeira execução. Não versionar (está no .gitignore).',
      '# Sem MONGODB_URI, a API usa o MongoDB local ou sobe o banco embutido em backend/data/db.',
      'PORT=3001',
      'NODE_ENV=development',
      `ADMIN_PASSWORD=${aleatorio(12, 'base64url')}`,
      `JWT_SECRET=${aleatorio(32)}`,
      `SERVIDOR_SEGREDO=${segredo}`,
      'FRONTEND_URL=http://localhost:3000',
      '# Modo demonstração: botão "Entrar no painel como editor de demonstração" e dados de exemplo',
      '# Localmente o reset periódico fica desligado (DEMO_RESET_MINUTOS=0) para não apagar seus dados.',
      'DEMO_ENABLED=true',
      'DEMO_RESET_MINUTOS=0',
      '',
    ].join('\n');
    fs.writeFileSync(envApi, conteudo);
    log('[criado] codigo-fonte/backend/.env com segredos aleatórios e modo demonstração ligado');
  } else if (!daApi) {
    acrescentarLinha(envApi, `SERVIDOR_SEGREDO=${segredo}`);
    log('[ok] codigo-fonte/backend/.env mantido; acrescentado o SERVIDOR_SEGREDO que faltava');
  } else {
    log('[ok] codigo-fonte/backend/.env já existe (mantido como está)');
  }

  if (!fs.existsSync(envSite)) {
    const conteudo = [
      '# Gerado pelo iniciar.bat na primeira execução. Não versionar.',
      'NEXT_PUBLIC_API_URL=http://localhost:3001',
      'NEXT_PUBLIC_SITE_URL=http://localhost:3000',
      `SERVIDOR_SEGREDO=${segredo}`,
      '',
    ].join('\n');
    fs.writeFileSync(envSite, conteudo);
    log('[criado] codigo-fonte/frontend/.env.local');
  } else if (!doSite) {
    acrescentarLinha(envSite, `SERVIDOR_SEGREDO=${segredo}`);
    log('[ok] codigo-fonte/frontend/.env.local mantido; acrescentado o SERVIDOR_SEGREDO da API');
  } else {
    log('[ok] codigo-fonte/frontend/.env.local já existe (mantido como está)');
  }
}

// Executado direto (iniciar.bat): prepara os arquivos do repositório
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  prepararAmbiente({
    envApi: path.join(raiz, 'codigo-fonte/backend/.env'),
    envSite: path.join(raiz, 'codigo-fonte/frontend/.env.local'),
  });
}
