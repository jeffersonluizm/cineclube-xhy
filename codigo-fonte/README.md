# Cineclube XHY: código-fonte

## Estrutura

```
codigo-fonte/
  backend/    API REST (Express + TypeScript + MongoDB)
  frontend/   Site (Next.js 14 + TypeScript + Tailwind CSS)
```

## Requisitos

- Node.js 22+ (é o `engines` do backend). O banco embutido de desenvolvimento
  (`mongodb-memory-server`) exige 20.19 ou superior, e o `npm test` roda `tsx --test`
  com padrão glob nos arquivos, recurso do runner do Node que só existe a partir do 21.
  O `tsx` faz a transpilação do TypeScript, então os testes não dependem do type
  stripping nativo do Node.
- MongoDB (opcional em desenvolvimento: sem um MongoDB acessível, o backend
  sobe automaticamente um MongoDB embutido com dados salvos em `backend/data/`)

---

## Backend

```bash
cd backend
npm install
npm run seed   # popula o banco com dados de exemplo
npm run dev    # inicia em http://localhost:3001
npm test       # testes automatizados (node:test + supertest, banco em memória)
```

Organização do backend:

```
src/
  app.ts               monta o Express: helmet, CORS, limites, rotas e tratador de erros
  index.ts             carrega o .env, conecta no banco e sobe a porta
  lib/                 banco, slug, slug único, conteúdo (agrupar, vizinhos, trecho), endereços, links, senha, imagem
  middleware/          auth (JWT), erros (ErroHttp + tratador central), limitadores
  validacao/esquemas.ts  zod de todas as entradas do painel
  models/              Magazine, Article, Catalog, Cycle, Film, About (com índices)
  routes/              públicas (home, revista, catalogos, ciclos, sobre, descoberta), auth, upload
  routes/admin/        uma rota por recurso + resumo
```

O seed usa a mesma conexão da API: `MONGODB_URI` (ou o MongoDB local padrão) e, em
desenvolvimento, o banco embutido de `backend/data/db`, inclusive quando a API já está
rodando com ele. O log e a pergunta mostram em qual banco ele está, no formato
`host:porta/banco (configurado|embutido)`, sem usuário nem senha.

**O seed apaga revistas, textos, catálogos, ciclos, filmes e o Sobre** antes de inserir
os exemplos. Se o banco já tiver dados:

- com terminal interativo, ele pergunta (`s/N`); responder "não" cancela sem apagar
  nada e sai com código 0;
- sem terminal interativo, não apaga nada e sai com código 1. No **Git Bash** (mintty)
  o Node não enxerga o terminal: rode no cmd ou no PowerShell, ou use
  `winpty npm run seed`;
- para substituir sem perguntar: `npm run seed -- --force`.

Se o próprio seed precisou subir o banco embutido (API parada) e a API conectar nele
enquanto o seed roda, o seed não derruba o banco ao terminar: avisa no log e espera a
API desconectar. O banco embutido morre junto com o processo que o iniciou, então pare
a API antes de fechar a janela do seed. O caminho mais simples é subir a API primeiro
e rodar o seed depois: ele usa o banco que a API já abriu.

Os testes rodam com `tsx` e sobem um MongoDB só em memória: não tocam em
`backend/data/` nem no banco configurado no `.env`. O `npm test` carrega
`test/preparar.ts`, que liga `CINECLUBE_PROIBIR_BANCO_DEV=1`: com ela, qualquer
tentativa de usar a porta 27018 ou `backend/data/db` falha em vez de gravar no banco
de desenvolvimento.

**Variáveis de ambiente** (`backend/.env` · copie de `.env.example`):
```
MONGODB_URI=mongodb://localhost:27017/cineclube_xhy
PORT=3001
NODE_ENV=development                # "production" na hospedagem
ADMIN_PASSWORD=senha-do-editor      # senha de acesso ao painel /admin
JWT_SECRET=um-segredo-aleatorio     # assina os tokens de sessão do editor (obrigatório com banco remoto)
FRONTEND_URL=http://localhost:3000  # origens permitidas (CORS), separadas por vírgula
# CLOUDINARY_URL=cloudinary://...   # opcional local; obrigatório na hospedagem (ver abaixo)
# SERVIDOR_SEGREDO=...              # 32+ caracteres; o mesmo no site: identifica o servidor do site (fora do limite por IP)
# DEMO_ENABLED=true                 # modo demonstração (desligado por padrão; só no ambiente da demo).
#                                   # A API recusa partir se o nome do banco não tiver "demo", exceto
#                                   # o banco local com DEMO_RESET_MINUTOS=0 fora de produção.
# DEMO_RESET_MINUTOS=60             # reset dos dados de exemplo na demo (0 desliga; padrão 60)
# RATE_LIMIT_GERAL=300              # requisições por minuto por IP (0 desliga; a carga desliga)
# LOGIN_ERRADOS_POR_HORA=100        # teto global de logins errados (todos os IPs somados)
# MONGODB_TIMEOUT_MS=8000           # prazo para achar o banco na partida
# UPLOADS_DIR=...                   # pasta das imagens sem Cloudinary (padrão backend/uploads)

O `iniciar.bat` cria esse arquivo na primeira vez com segredos aleatórios fortes. Em
produção a API recusa subir com variável obrigatória faltando, `ADMIN_PASSWORD` com menos
de 12 caracteres ou `JWT_SECRET`/`SERVIDOR_SEGREDO` com menos de 32.
```

---

## Frontend

```bash
cd frontend
npm install
npm run dev    # inicia em http://localhost:3000
npm test       # testes das regras do front (tokens/contraste, sessão, login, RSS)
```

**Variáveis de ambiente** (`frontend/.env.local` · copie de `.env.local.example`):
```
NEXT_PUBLIC_API_URL=http://localhost:3001    # endereço da API
NEXT_PUBLIC_SITE_URL=http://localhost:3000   # endereço público do site (metatags de compartilhamento)
SERVIDOR_SEGREDO=...                          # só de servidor (nunca NEXT_PUBLIC_): o mesmo valor da API
# CLOUDINARY_CLOUD_NAME=...                   # opcional: next/image aceita só essa conta
# NEXT_PUBLIC_DEMO=1                          # site da demonstração: noindex e robots.txt bloqueando tudo
```

---

## Painel do editor (`/admin`)

Área de publicação, protegida por uma senha única da equipe (a `ADMIN_PASSWORD` da API).
A sessão dura 8 horas; o painel avisa 10 minutos antes e, se a sessão expirar no meio de
uma edição, pede a senha numa janela por cima da página, sem perder o que foi digitado.

| Página | O que faz |
|---|---|
| `/admin/login` | Entrar (mostrar senha, autocomplete, aviso de Caps Lock, contagem quando o limite de tentativas é atingido, `?motivo=` e `?next=`) |
| `/admin/recuperar-senha` | Explica, sem prometer o que não existe, como receber ou trocar a senha |
| `/admin/sessao-expirada` | Sessão vencida ao abrir o painel: entra de novo e volta para a página de origem |
| `/admin/sair` | Encerra a sessão neste navegador |
| `/admin` | Início: contagens, rascunhos pendentes e textos editados por último |
| `/admin/revistas`, `/admin/revistas/nova`, `/admin/revistas/[id]` | Edições da revista e seus textos |
| `/admin/catalogos`, `/admin/catalogos/[id]` | Catálogos: capa, apresentação e textos |
| `/admin/ciclos`, `/admin/ciclos/[id]` | Exibições: dados, notas, páginas de filme, textos e programação (cada sessão escolhe a página do filme) |
| `/admin/artigos/[id]`, `/admin/filmes/[id]` | Editor de texto em blocos e ficha do filme |
| `/admin/sobre` | Apresentação do cineclube e equipe (links só `https://` ou `mailto:`) |

- **Editor de textos**: blocos (parágrafo, subtítulo, citação, imagem) reordenáveis por
  arrastar ou pelas setas (teclado), imagem de compartilhamento, notas de rodapé,
  rascunho/publicado. Guarda um rascunho local no navegador e oferece restaurar.
- **Feedback**: avisos (toasts) de sucesso e erro; ações de reordenar voltam atrás se a
  API falhar; sair com alterações não salvas pede confirmação.
- **Exclusão em cascata** (revista, catálogo, exibição): o diálogo mostra quantos textos
  e filmes vão junto e pede para digitar o nome.
- **Fora dos buscadores**: `noindex` em todas as páginas e `Disallow` no `robots.txt`.

**Imagens enviadas:** com `CLOUDINARY_URL` definida, vão para o Cloudinary (CDN,
persistente). Sem ela, ficam em `backend/uploads/` e são servidas em
`http://localhost:3001/uploads/…`, adequado só para desenvolvimento local. O tipo da
imagem é conferido pelos primeiros bytes do arquivo, não pelo que o navegador declara.

### Segurança da API

- `helmet` (CSP `default-src 'none'`, `nosniff`, `X-Frame-Options`), sem `X-Powered-By`.
- CORS só para as origens de `FRONTEND_URL`; origem desconhecida recebe **403**.
- Limite geral de 300 requisições por minuto por IP (`RATE_LIMIT_GERAL`, `0` desliga),
  login com no máximo 10 tentativas erradas a cada 15 minutos e upload com 60 envios a
  cada 15 minutos. O painel lê os cabeçalhos `RateLimit` para mostrar quanto falta.
- Senha comparada por hash SHA-256 em tempo constante (nem o tamanho vaza).
- Token JWT HS256 de 8 horas. O segredo de desenvolvimento só é aceito fora de produção
  **e** com banco local; com banco remoto sem `JWT_SECRET`, a API não emite tokens.
- O servidor do site se identifica com `X-Servidor-Site` (segredo só de servidor) e fica
  fora do limite por IP; o abuso de visitantes é contido no `middleware.ts` do site
  (busca com termo 20/min, revalidação 30/min e páginas 420/min por IP do visitante; 420
  cobre 60 visitas por minuto, porque cada visita passa umas 7 vezes pelo middleware entre o
  documento e os pré-carregamentos dos links). Nenhum cabeçalho isenta da contagem: o Next 14
  remove os de prefetch antes do middleware e o `Purpose: prefetch` vem do cliente. O 429 de
  página volta em HTML na identidade do site.
- O token carrega a versão da senha: trocar `ADMIN_PASSWORD` derruba todas as sessões.
- Em produção a API usa `trust proxy` = 1 (um proxy na frente, como no Render), para os
  limites enxergarem o IP do visitante. Com outro proxy na frente (Cloudflare), aumente o
  número em `src/app.ts`.
- CORS fechado em `FRONTEND_URL`: as prévias da Vercel (outra URL por branch) recebem 403
  no painel até a URL delas entrar na lista.
- Demonstração (`DEMO_ENABLED`): upload de até 2 MB, 10 por hora por IP, em `uploads/demo`,
  apagado a cada reset (60 min); banco precisa ter `demo` no nome.
- Teto global de 100 logins errados por hora (força bruta distribuída).
- Query string simples (sem objetos aninhados) e filtros com `z.strictObject`.
- Toda entrada do painel passa por esquemas `zod` (tipos, tamanhos, enums, ids, URLs) e
  as atualizações rodam os validadores do Mongoose; filtros de consulta não aceitam
  operadores (`?parentId[$ne]=` é recusado com 400).
- Erros centralizados (`middleware/erros.ts`): 400 validação, 404, 409 duplicado,
  413 corpo grande, 503 banco indisponível; nunca devolve stack.

### API

Públicas (sem autenticação):

| Rota | Descrição |
|------|-----------|
| `GET /api/health` | Situação da API e do banco |
| `GET /api/home` | Publicação mais recente e todas as edições com os primeiros textos |
| `GET /api/revista` | Edições da revista |
| `GET /api/revista/:numero` | Edição com o sumário agrupado por coluna (trechos, sem o corpo) |
| `GET /api/revista/:numero/artigo/:slug` | Texto completo, edição, anterior e próximo |
| `GET /api/catalogos`, `GET /api/catalogos/:slug` | Catálogos e um catálogo com as seções |
| `GET /api/catalogos/:slug/texto/:textSlug` | Texto do catálogo com anterior e próximo |
| `GET /api/ciclos`, `GET /api/ciclos/:slug` | Exibições e uma exibição com filmes e textos |
| `GET /api/ciclos/:slug/filme/:filmSlug` | Página do filme com anterior e próximo |
| `GET /api/ciclos/:slug/texto/:textSlug` | Texto do ciclo com anterior e próximo |
| `GET /api/sobre` | Apresentação e equipe |
| `GET /api/busca?q=` | Busca (índice de texto, sem acentos) em textos publicados e filmes |
| `GET /api/autores`, `GET /api/autores/:slug` | Autores com contagem e textos de um autor |
| `GET /api/recentes` | 30 textos mais recentes com endereço (alimenta o RSS) |
| `GET /api/mapa` | Todas as páginas públicas com data de atualização (alimenta o sitemap) |
| `GET /api/demo` | Modo demonstração: papel disponível (404 com `DEMO_ENABLED` desligado) |
| `POST /api/demo/entrar` | `{ papel: 'editor' }` → token de editor com um clique (só com a demonstração ligada) |

Autenticação e painel (todas as rotas `/api/admin/*` e `/api/upload` exigem `Authorization: Bearer <token>`):

| Rota | Descrição |
|------|-----------|
| `POST /api/auth/login` | Login do editor (`{ password }` → `{ token, expiraEm }`) |
| `GET /api/auth/sessao` | Confere o token e devolve quando ele expira |
| `POST /api/upload` | Upload de imagem (`multipart/form-data`, campo `image`, até 10 MB) |
| `GET /api/admin/resumo` | Contagens, rascunhos e últimos editados |
| `GET/POST /api/admin/revistas` + `GET/PUT/DELETE /:id` + `GET /:id/impacto` | Revistas (impacto = textos que a exclusão leva junto) |
| `GET/POST /api/admin/artigos` (`?parentId=&parentType=`) + `GET/PUT/DELETE /:id` + `PUT /reorder` | Textos de revista, catálogo e ciclo |
| `GET/POST /api/admin/catalogos` + `GET/PUT/DELETE /:id` + `GET /:id/impacto` | Catálogos |
| `GET/POST /api/admin/ciclos` + `GET/PUT/DELETE /:id` + `GET /:id/impacto` | Exibições com programação (sessões com `filmId`) |
| `GET/POST /api/admin/filmes` (`?cycleId=`) + `GET/PUT/DELETE /:id` + `PUT /reorder` | Páginas de filme |
| `GET/PUT /api/admin/sobre` | Apresentação e equipe |

---

## Páginas públicas

| URL | Descrição |
|-----|-----------|
| `/` | Página inicial: prateleira de edições (rolar, deslizar ou setas) |
| `/revista`, `/revista/[number]`, `/revista/[number]/artigo/[slug]` | Edições, sumário e leitura |
| `/catalogos`, `/catalogos/[slug]`, `/catalogos/[slug]/[textSlug]` | Catálogos e textos |
| `/ciclos-mostras`, `/ciclos-mostras/[slug]` | Exibições com programação, textos e notas |
| `/ciclos-mostras/[slug]/[filmSlug]`, `/ciclos-mostras/[slug]/texto/[textSlug]` | Filme e texto do ciclo |
| `/busca` | Busca em textos, filmes e autores |
| `/autores`, `/autores/[slug]` | Autores e textos de cada um |
| `/sobre` | Apresentação, equipe e contatos |
| `/como-foi-feito` | Arquitetura, decisões, testes e resultados de carga deste site |
| `/feed.xml` | RSS dos textos mais recentes |
| `/robots.txt`, `/sitemap.xml` | Gerados automaticamente (sitemap com textos, filmes e autores) |

Estados de sistema: 404 com busca ("fim da sessão", status 404 de verdade); "serviço
indisponível" quando a API falha (status 500, não vira lista vazia nem 404 falso);
carregando só na busca e na lista de autores. As páginas de conteúdo não têm `loading.tsx`
de propósito: com streaming o Next já envia status 200 antes de saber se a página existe,
e o 404/500 deixaria de ser real (o cache de 60 s torna a espera rara);
`global-error` para falha do layout. Rodapé em todas as páginas com como participar,
contato e o link para o RSS.

**Cache:** as páginas guardam as respostas da API por até 60 s (etiqueta `conteudo`) e o
painel chama `/api/revalidar` depois de cada alteração, então o editor vê a mudança na
hora e o visitante não espera a API a cada página. Se a API não estiver no ar durante o
`next build`, as páginas passam a ser renderizadas por pedido em vez de quebrar o build.

**Identidade:** cores e escala de títulos em `frontend/src/lib/tokens.ts`. O teste
`tokens.test.ts` confere o contraste WCAG AA de todo par texto/fundo usado.

---

## Hospedagem

Desenho gratuito: site na Vercel, API no Render (`render.yaml` na raiz), MongoDB Atlas M0
com um banco só de demonstração e Cloudinary opcional. Passo a passo, variáveis e
checklist de conferência em [`docs/deploy.md`](../docs/deploy.md).

---

## Histórico de versões

### [1.3.0] - 04/10/2026
#### Adicionado
- Busca (`/busca`, índice de texto sem acentos), páginas de autor (`/autores`), RSS (`/feed.xml`) e página "como foi feito"
- Rodapé em todas as páginas com como participar, contato e RSS
- Painel: início com contagens, rascunhos e últimos editados; páginas de esqueci a senha, sessão expirada e sair; 404 e erro próprios
- Sessão de 8 h com aviso antes de expirar e re-login por cima da página, sem perder o formulário
- Rascunho local no editor de textos, aviso de alterações não salvas, toasts e diálogo de exclusão em cascata com contagem
- Imagem de compartilhamento no editor de textos; nota do autor e notas do ciclo editáveis e exibidas
- Programação ligada às páginas de filme pelo id (sessões antigas continuam pelo slug)
- Textos de ciclo no painel e no site (`/ciclos-mostras/[slug]/texto/[textSlug]`)
- `iniciar.bat` na raiz para subir API e site no Windows
- Testes de rotas públicas, do CRUD do painel, de validação, de segurança e de descoberta (API) e das regras do front
- Harness de carga isolado (`carga/`) e resultados em `docs/carga/`
- Modo demonstração (`DEMO_ENABLED`, `GET /api/demo`, entrar como editor com um clique, reset periódico)
- Roteiro de hospedagem (`docs/deploy.md`), ADRs (`docs/adr/`), ESLint, Prettier e CI (`.github/workflows/ci.yml`)
- `iniciar.bat` idempotente: confere o Node, cria `.env` com segredos fortes, espera a API e abre o navegador
#### Alterado
- Identidade em tokens (`src/lib/tokens.ts`) com variantes de cor AA para texto e escala de títulos; logo em SVG
- Painel na estética do impresso (papel, fios, sem cartões arredondados)
- `admin.ts` dividido em uma rota por recurso; erros centralizados; validação com zod e `runValidators`
- Home sem N+1 (consultas fixas), sumários sem o corpo dos textos, `lean`, índices, reordenação em lote
- Site com cache de 60 s e revalidação sob demanda no lugar de `no-store`
- Falha da API mostra "serviço indisponível" (antes virava lista vazia ou 404 falso)
- O seed usa o mesmo banco da API, pede confirmação (ou `--force`) e traz textos de exemplo próprios
#### Segurança
- helmet, CORS 403, limitador geral, upload validado pelos bytes, links só `https:`/`mailto:`
- Senha comparada por hash, token de 8 h, segredo de desenvolvimento só com banco local
- CSP e cabeçalhos de segurança no site; painel com `noindex`
- Segredo servidor-a-servidor e contenção por IP no site; teto global de logins errados
- Configuração de produção validada na partida; token invalidado ao trocar a senha
- Next 14.2.35, otimizador de imagens desligado; `npm audit fix` na API
- Upload deixa de aceitar SVG (só jpg, png, webp, gif e avif)
#### Corrigido
- Criação simultânea de textos com o mesmo título gerava erro 500 (slug duplicado)
- Remover a capa de uma revista, catálogo ou ciclo não era gravado
- Erros silenciosos ao reordenar ou excluir no painel

### [1.2.0] - 15/09/2026
#### Adicionado
- Layout responsivo em todas as páginas públicas (barra superior no celular, coluna lateral no desktop)
- Metatags por página (título, descrição, Open Graph com capa) para compartilhamento em redes sociais
- Favicon, páginas de erro 404/500 e tela de carregamento com a identidade visual
- `robots.txt` e `sitemap.xml` gerados automaticamente
- Upload de imagens para o Cloudinary quando `CLOUDINARY_URL` está definida
- Limite de tentativas de login e comparação de senha em tempo constante
- `render.yaml`, workflow de keep-alive e guia de hospedagem neste README
#### Alterado
- Fontes carregadas via `next/font` (self-hosted, sem requisição ao Google Fonts)
- CORS aceita várias origens (`FRONTEND_URL` separado por vírgula)
- Em produção o servidor exige as variáveis de ambiente obrigatórias e não usa segredo padrão
- Imagens de texto carregam sob demanda e não flutuam no celular
- Rota antiga `/revista/[n]/[coluna]/[slug]` redireciona permanentemente para `/revista/[n]/artigo/[slug]`
#### Corrigido
- Links dos textos de catálogo apontavam para `/texto/...`, rota inexistente (404)
- Páginas de conteúdo inexistente respondiam HTTP 200: listagens foram para o grupo de rotas `(listas)`, único com `loading.tsx`, e as páginas de detalhe voltaram a responder 404 real
- Crédito autoral apontava para um domínio placeholder

### [1.1.0] - 06/07/2026
#### Adicionado
- Painel do editor em `/admin` com login por senha e editor de artigos em blocos
- Upload de imagens com inserção no meio do texto (posição, tamanho e legenda)
- API de publicação autenticada (JWT): CRUD de revistas e artigos, reordenação
- Logo oficial e ícones de redes sociais (Instagram, Letterboxd, YouTube)
- Fallback de MongoDB embutido para desenvolvimento (`backend/data/`)

### [1.0.0] - 19/04/2026
#### Adicionado
- Backend Express + TypeScript + MongoDB com modelos e rotas completas
- Frontend Next.js 14 + TypeScript + Tailwind CSS
- Script de seed com dados de exemplo
- Todas as páginas conforme mockup visual
