# Cineclube XHY — Código Fonte

## Estrutura

```
codigo-fonte/
  backend/    API REST (Express + TypeScript + MongoDB)
  frontend/   Site (Next.js 14 + TypeScript + Tailwind CSS)
```

## Requisitos

- Node.js 18+
- MongoDB (opcional em desenvolvimento — sem um MongoDB acessível, o backend
  sobe automaticamente um MongoDB embutido com dados salvos em `backend/data/`)

---

## Backend

```bash
cd backend
npm install
npm run seed   # popula o banco com dados de exemplo
npm run dev    # inicia em http://localhost:3001
```

**Variáveis de ambiente** (`backend/.env` — copie de `.env.example`):
```
MONGODB_URI=mongodb://localhost:27017/cineclube_xhy
PORT=3001
NODE_ENV=development                # "production" na hospedagem
ADMIN_PASSWORD=senha-do-editor      # senha de acesso ao painel /admin
JWT_SECRET=um-segredo-aleatorio     # assina os tokens de sessão do editor
FRONTEND_URL=http://localhost:3000  # origens permitidas (CORS), separadas por vírgula
# CLOUDINARY_URL=cloudinary://...   # opcional local; obrigatório na hospedagem (ver abaixo)
```

---

## Frontend

```bash
cd frontend
npm install
npm run dev    # inicia em http://localhost:3000
```

**Variáveis de ambiente** (`frontend/.env.local` — copie de `.env.local.example`):
```
NEXT_PUBLIC_API_URL=http://localhost:3001    # endereço da API
NEXT_PUBLIC_SITE_URL=http://localhost:3000   # endereço público do site (metatags de compartilhamento)
```

---

## Painel do editor (`/admin`)

Área de publicação da revista, protegida por senha (a `ADMIN_PASSWORD` do backend).

- **`/admin/login`** — entrada do editor
- **`/admin`** — edições da revista (`/admin/revistas/nova`, `/admin/revistas/[id]`)
- **`/admin/catalogos`** — catálogos: capa, descrição e textos de cada catálogo
- **`/admin/ciclos`** — ciclos & mostras: dados, programação (sessões) e páginas de filmes
- **Editor de artigos/textos** — o texto é montado em blocos (parágrafo, subtítulo,
  citação e imagem). Imagens podem ser inseridas em qualquer ponto do texto,
  com legenda, tamanho e posição (largura total, centralizada ou flutuando à
  esquerda/direita). Blocos podem ser reordenados arrastando com o mouse (⠿)
  ou pelas setas.

**Imagens enviadas:** com `CLOUDINARY_URL` definida, vão para o Cloudinary (CDN,
persistente). Sem ela, ficam em `backend/uploads/` e são servidas em
`http://localhost:3001/uploads/…` — adequado só para desenvolvimento local.

**Proteções:** o login aceita no máximo 10 tentativas por IP a cada 15 minutos.
Em produção o servidor se recusa a subir sem `MONGODB_URI`, `ADMIN_PASSWORD`,
`JWT_SECRET` e `FRONTEND_URL`.

### API de publicação

| Rota | Descrição |
|------|-----------|
| `POST /api/auth/login` | Login do editor (`{ password }` → `{ token }`) |
| `POST /api/upload` | Upload de imagem (`multipart/form-data`, campo `image`) |
| `GET/POST /api/admin/revistas` | Listar / criar revistas |
| `PUT/DELETE /api/admin/revistas/:id` | Atualizar / excluir revista |
| `GET/POST /api/admin/artigos` | Listar / criar artigos (revista, catálogo ou ciclo via `parentType`) |
| `GET/PUT/DELETE /api/admin/artigos/:id` | Buscar / atualizar / excluir artigo |
| `PUT /api/admin/artigos/reorder` | Reordenar artigos (`{ ids: [...] }`) |
| `GET/POST /api/admin/catalogos` + `PUT/DELETE /:id` | CRUD de catálogos |
| `GET/POST /api/admin/ciclos` + `PUT/DELETE /:id` | CRUD de ciclos & mostras (com programação) |
| `GET/POST /api/admin/filmes` + `GET/PUT/DELETE /:id` + `PUT /reorder` | CRUD de páginas de filmes |

Todas as rotas `/api/admin/*` e `/api/upload` exigem `Authorization: Bearer <token>`.

---

## Páginas públicas

| URL | Descrição |
|-----|-----------|
| `/` | Página inicial com última atualização |
| `/revista` | Lista de edições por ano |
| `/revista/[number]` | Sumário da revista |
| `/revista/[number]/artigo/[slug]` | Texto da revista |
| `/catalogos` | Lista de catálogos por ano |
| `/catalogos/[slug]` | Catálogo individual |
| `/catalogos/[slug]/[textSlug]` | Texto do catálogo |
| `/ciclos-mostras` | Lista de ciclos e mostras por ano |
| `/ciclos-mostras/[slug]` | Ciclo/mostra com programação |
| `/ciclos-mostras/[slug]/[filmSlug]` | Página do filme |
| `/sobre` | Sobre o cineclube e equipe |
| `/robots.txt`, `/sitemap.xml` | Gerados automaticamente (o painel `/admin` fica fora dos buscadores) |

Todas as páginas públicas são responsivas: no desktop a navegação é a coluna
lateral; no celular vira uma barra superior compacta.

---

## Hospedagem gratuita com domínio próprio

Arquitetura recomendada (custo zero além do domínio):

| Peça | Serviço | Endereço |
|------|---------|----------|
| Site (Next.js) | [Vercel](https://vercel.com) — plano Hobby | `seudominio.com.br` e `www.` |
| API (Express) | [Render](https://render.com) — plano Free | `api.seudominio.com.br` |
| Banco | [MongoDB Atlas](https://cloud.mongodb.com) — cluster M0 | — |
| Imagens | [Cloudinary](https://cloudinary.com) — plano Free | `res.cloudinary.com/...` |

### 1. Preparação

1. Faça commit e push do código para o GitHub (as pastas `backend/` e `frontend/`
   precisam estar no repositório; `.env`, `uploads/` e `data/` já são ignorados).
2. No Atlas: **Network Access → Add IP → Allow access from anywhere** (`0.0.0.0/0`),
   pois o Render Free não tem IP fixo. Copie a string de conexão.
3. No Cloudinary: crie a conta gratuita e copie a **API Environment variable**
   (`cloudinary://API_KEY:API_SECRET@CLOUD_NAME`) do painel.
4. Gere um segredo para o JWT:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

### 2. API no Render

1. **New → Blueprint**, selecione o repositório: o arquivo `render.yaml` na raiz
   já descreve o serviço (`rootDir: codigo-fonte/backend`, build e health check).
2. Preencha as variáveis pedidas: `MONGODB_URI`, `ADMIN_PASSWORD`, `FRONTEND_URL`
   (`https://seudominio.com.br,https://www.seudominio.com.br`) e `CLOUDINARY_URL`.
   `JWT_SECRET` é gerado pelo Render.
3. Em **Settings → Custom Domains**, adicione `api.seudominio.com.br`. O Render
   mostra o CNAME a criar no seu registrador.
4. Teste: `https://api.seudominio.com.br/api/health` deve responder `{"status":"ok","db":"connected"}`.

> Sem o Blueprint, crie um **Web Service** manual com Root Directory
> `codigo-fonte/backend`, Build `npm ci --include=dev && npm run build`,
> Start `npm start` e as mesmas variáveis (mais `NODE_ENV=production`).

### 3. Site na Vercel

1. **Add New → Project**, importe o repositório e defina
   **Root Directory = `codigo-fonte/frontend`** (framework Next.js é detectado).
2. Environment Variables:
   ```
   NEXT_PUBLIC_API_URL=https://api.seudominio.com.br
   NEXT_PUBLIC_SITE_URL=https://seudominio.com.br
   ```
3. Deploy. Depois, em **Settings → Domains**, adicione `seudominio.com.br` e
   `www.seudominio.com.br` (marque um deles para redirecionar ao outro).

### 4. DNS no registrador do domínio

```
@      A      76.76.21.21              (Vercel — confirme o IP mostrado no painel)
www    CNAME  cname.vercel-dns.com
api    CNAME  <nome-do-servico>.onrender.com
```

O certificado HTTPS é emitido automaticamente nos dois serviços após a propagação.

### 5. Manter a API acordada

O Render Free hiberna após 15 min sem tráfego; o primeiro acesso demora até 60 s.
Duas formas gratuitas de evitar isso (use uma ou ambas):

- **GitHub Actions**: o workflow `.github/workflows/keep-alive.yml` faz um ping a cada
  10 min. Basta criar, em *Settings → Secrets and variables → Actions → Variables*,
  a variável `API_HEALTH_URL = https://api.seudominio.com.br/api/health`.
- **cron-job.org**: crie um job gratuito chamando a mesma URL a cada 10 min.

Enquanto a API responde, o site mostra uma tela de carregamento com a identidade
visual do cineclube em vez de uma página em branco.

### Alternativas

- **Koyeb** (Free) no lugar do Render: mesma configuração, também hiberna.
- **Oracle Cloud Always Free** (VM ARM): sem hibernação e com disco persistente
  (dispensa o Cloudinary), mas exige administrar Linux, Docker e certificados.

---

## Histórico de versões

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
