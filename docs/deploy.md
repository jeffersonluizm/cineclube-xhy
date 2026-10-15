# Publicar a demonstração (Vercel + Render + Atlas)

Desenho gratuito: **site na Vercel**, **API no Render**, **MongoDB Atlas M0 com um banco só
de demonstração**. O Cloudinary fica para o site oficial: na demonstração as imagens enviadas
ficam no disco da API e somem a cada reset. O código já
está pronto; este roteiro é o que falta fazer nos painéis (cerca de 30 minutos).

> O modo demonstração **apaga e recria os dados a cada hora** (`DEMO_RESET_MINUTOS=60`).
> Use um banco exclusivo para a demonstração, nunca o banco com o conteúdo real do
> cineclube: com `DEMO_ENABLED=true` a API **se recusa a subir** se o nome do banco não
> tiver `demo` (ex.: `cineclube_demo`).

## 0. Gerar os segredos

No terminal, gere três valores (guarde num gerenciador de senhas, não no repositório):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"   # SERVIDOR_SEGREDO
node -e "console.log(require('crypto').randomBytes(12).toString('base64url'))"   # ADMIN_PASSWORD (16 caracteres)
```

`JWT_SECRET` é gerado pelo próprio Render.

## 1. Repositório no GitHub

1. Crie um repositório (público, para o portfólio) e envie a branch principal:
   `git remote add origin <url>` e `git push -u origin main`.
2. Confira que `.env`, `backend/data/` e `backend/uploads/` **não** foram enviados (estão no `.gitignore`).
3. O workflow `.github/workflows/ci.yml` roda lint, testes e build em cada push.

## 2. Banco no MongoDB Atlas

1. Crie um cluster **M0** (gratuito).
2. **Database Access:** crie um usuário só para a demonstração, com permissão no banco `cineclube_demo`.
3. **Network Access:** `0.0.0.0/0` (o Render gratuito não tem IP fixo).
4. Copie a string de conexão e troque o nome do banco para `cineclube_demo`:
   `mongodb+srv://usuario:senha@cluster0.xxxxx.mongodb.net/cineclube_demo`

Não é preciso rodar o seed: com `DEMO_ENABLED=true`, a API cria os dados de exemplo na
primeira partida (banco vazio) e os restaura periodicamente. Os índices são criados pela
própria API ao subir.

## 3. API no Render

1. **New → Blueprint**, escolha o repositório: o `render.yaml` da raiz descreve o serviço
   (`rootDir: codigo-fonte/backend`, build, start e health check em `/api/health`).
2. Preencha as variáveis marcadas como `sync: false`:

| Variável | Valor |
|---|---|
| `MONGODB_URI` | a string do Atlas com `/cineclube_demo` |
| `ADMIN_PASSWORD` | a senha gerada (12+ caracteres, senão a API não sobe) |
| `SERVIDOR_SEGREDO` | o segredo gerado (32+ caracteres); o mesmo valor vai na Vercel |
| `FRONTEND_URL` | `https://<seu-site>.vercel.app` (some o domínio próprio, separado por vírgula) |
| `CLOUDINARY_URL` | deixe vazio na demonstração (é ignorado com `DEMO_ENABLED`); use no site oficial |

3. Já vêm preenchidas: `NODE_ENV=production`, `DEMO_ENABLED=true`, `DEMO_RESET_MINUTOS=60`,
   `MONGODB_TIMEOUT_MS=30000`, `JWT_SECRET` (gerado).
   Na demonstração o upload fica contido: até 2 MB por imagem, 10 envios por hora por
   visitante, gravados em `uploads/demo` e apagados a cada reset.
4. **Proxy:** a API usa `app.set('trust proxy', 1)` em produção, que é o correto no Render
   (um proxy na frente). Assim o limite de requisições e o de logins enxergam o IP real
   do visitante e não o do balanceador. Se colocar outro proxy na frente (Cloudflare),
   aumente esse número em `src/app.ts`.
5. Teste: `https://<api>.onrender.com/api/health` deve responder
   `{"status":"ok","db":"connected"}` e `https://<api>.onrender.com/api/demo` deve
   responder com `"ativo": true`.

## 4. Site na Vercel

1. **Add New → Project**, importe o repositório, **Root Directory = `codigo-fonte/frontend`**.
2. Environment Variables (Production):

| Variável | Valor | Observação |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://<api>.onrender.com` | pública (vai para o navegador) |
| `NEXT_PUBLIC_SITE_URL` | `https://<seu-site>.vercel.app` | metatags, RSS e sitemap |
| `SERVIDOR_SEGREDO` | o mesmo segredo do Render | **só de servidor**: nunca prefixe com `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_DEMO` | `1` | tira o site da demonstração dos buscadores (`noindex` e `robots.txt` bloqueando tudo) |
| `CLOUDINARY_CLOUD_NAME` | o nome da conta | só no site oficial: libera o `next/image` para essa conta |

3. Deploy. Se a API estiver dormindo durante o build, as páginas passam a ser
   renderizadas por pedido em vez de quebrar o build; um novo deploy com a API acordada
   volta a gerar as páginas estáticas.
4. Atualize `FRONTEND_URL` no Render com a URL final da Vercel (e o domínio próprio, se houver).
5. **Prévias da Vercel:** cada branch ganha uma URL própria (`<projeto>-git-<branch>.vercel.app`).
   O site público dessas prévias funciona, porque os dados saem do servidor da Vercel. Já o
   painel chama a API pelo navegador, e a API responde **403** a uma origem que não está em
   `FRONTEND_URL`. Isso é proposital (CORS fechado). Para testar o painel numa prévia,
   acrescente a URL dela em `FRONTEND_URL`, separada por vírgula, e remova depois.

### Por que o segredo servidor-a-servidor

A API limita 300 requisições por minuto **por IP**. Quem busca os dados das páginas é o
servidor da Vercel, então todos os visitantes chegariam à API com o mesmo IP e um único
visitante abusivo derrubaria o site para todos. O servidor do site manda o cabeçalho
`X-Servidor-Site` com `SERVIDOR_SEGREDO`; a API o reconhece (comparação em tempo
constante) e não o limita. O abuso é contido no próprio site pelo `middleware.ts`, que
limita por IP do visitante (busca com termo: 20/min; revalidação: 30/min; páginas: 420/min,
o equivalente a 60 visitas, já que cada visita passa umas 7 vezes pelo middleware). Nenhum
cabeçalho de prefetch isenta da contagem, porque o cliente pode forjá-lo.

## 5. Manter acordado (recomendado, não obrigatório)

O Render gratuito dorme depois de 15 minutos sem tráfego e leva de 30 a 60 s para
acordar. O site lida com isso: as páginas públicas saem do cache da Vercel, e o painel
mostra "acordando o servidor de demonstração" em vez de erro.

**O reset da demonstração não depende do keep-alive.** O horário do último reset fica no
banco (coleção `demo_meta`). A API confere o prazo ao acordar e a cada 5 minutos: se já
passou `DEMO_RESET_MINUTOS`, restaura. Também restaura quando uma imagem enviada sumiu do
disco, que o Render apaga ao dormir. O keep-alive só serve para o visitante não esperar a
API acordar. Para isso:

- **GitHub Actions:** o workflow `keep-alive.yml` faz um ping a cada 10 minutos; crie a
  variável `API_HEALTH_URL = https://<api>.onrender.com/api/health` em
  *Settings → Secrets and variables → Actions → Variables*.
- ou **cron-job.org** chamando a mesma URL a cada 10 minutos.

## 6. Conferir a publicação

- [ ] `https://<api>/api/health` responde `db: connected`; `https://<api>/api/demo` responde `ativo: true`.
- [ ] A página inicial mostra a prateleira com as capas de exemplo.
- [ ] `/admin/login` mostra "Explore a demonstração"; o botão entra no painel sem senha.
- [ ] No painel, criar um texto, ver no site (o cache é revalidado na hora) e excluir.
- [ ] `https://<site>/revista/999` responde 404 com a página "fim da sessão".
- [ ] Cabeçalhos: `curl -I https://<site>/` mostra `Content-Security-Policy` e `X-Frame-Options: DENY`;
      `curl -I https://<api>/api/health` mostra `X-Content-Type-Options: nosniff`.
- [ ] CORS: `curl -H "Origin: https://exemplo.com" https://<api>/api/health` responde 403.
- [ ] Compartilhar o link no WhatsApp/LinkedIn mostra título, descrição e imagem.
- [ ] Atualizar os links do topo do `README.md` com a URL do site.

## Produção real (conteúdo do cineclube)

Para o site oficial, repita os passos com **outro** banco, `DEMO_ENABLED` **desligado**
(remova a variável) e uma `ADMIN_PASSWORD` própria da equipe. Nesse modo `GET /api/demo`
responde 404 e o login exige a senha.
