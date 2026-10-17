# Publicar: demonstração e produção (Vercel + Render + Atlas)

Este roteiro tem duas partes: as seções 0 a 6 publicam a **demonstração** de portfólio
(painel aberto, dados de exemplo); a seção [Produção real](#produção-real-site-em-uso-pelo-cineclube-xhy)
publica o **site em uso pelo Cineclube XHY**, separado dela.

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
| `SERVIDOR_SEGREDO` | o segredo gerado (32+ caracteres); o mesmo valor vai na Vercel. **Obrigatório:** sem ele a API não sobe em produção |
| `FRONTEND_URL` | `https://<seu-site>.vercel.app` (some o domínio próprio, separado por vírgula) |
| `CLOUDINARY_URL` | deixe vazio na demonstração (é ignorado com `DEMO_ENABLED`); use no site oficial |

3. Já vêm preenchidas: `NODE_ENV=production`, `DEMO_ENABLED=true`, `DEMO_RESET_MINUTOS=60`,
   `MONGODB_TIMEOUT_MS=30000`, `JWT_SECRET` (gerado).
   Na demonstração o volume também fica contido: teto por coleção (`DEMO_TETO_REVISTAS=50`,
   `DEMO_TETO_TEXTOS=300`, `DEMO_TETO_CATALOGOS=50`, `DEMO_TETO_EXIBICOES=50`,
   `DEMO_TETO_FILMES=300`), corpo JSON de até 256 kB e `DEMO_ESCRITAS_POR_HORA=60` por IP.
   Os padrões já valem sem definir nada.
   O upload também fica contido: até 2 MB por imagem, 10 envios por hora por
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
2. Environment Variables, marcando **Production e Preview** nas obrigatórias: o `next build`
   das prévias também para sem `NEXT_PUBLIC_API_URL` em https e sem `SERVIDOR_SEGREDO`.
   Em Preview, `NEXT_PUBLIC_SITE_URL` pode ficar com a URL de produção.

| Variável | Valor | Observação |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://<api>.onrender.com` | Production e Preview; pública (vai para o navegador). Obrigatória e com https, senão o build falha |
| `NEXT_PUBLIC_SITE_URL` | `https://<seu-site>.vercel.app` | metatags, RSS e sitemap |
| `SERVIDOR_SEGREDO` | o mesmo segredo do Render | Production e Preview; **só de servidor**: nunca prefixe com `NEXT_PUBLIC_`. Obrigatório: sem ele o build falha |
| `NEXT_PUBLIC_DEMO` | `1` | tira o site da demonstração dos buscadores (`noindex` e `robots.txt` bloqueando tudo) |
| `CLOUDINARY_CLOUD_NAME` | o nome da conta | só no site oficial: libera o `next/image` para essa conta |

3. Deploy. Se a API estiver dormindo durante o build, as páginas passam a ser
   renderizadas por pedido em vez de quebrar o build; um novo deploy com a API acordada
   volta a gerar as páginas estáticas.
4. Atualize `FRONTEND_URL` no Render com a URL final da Vercel (e o domínio próprio, se houver).
5. **Prévias da Vercel:** cada branch ganha uma URL própria (`<projeto>-git-<branch>.vercel.app`).
   O build da prévia usa as variáveis marcadas como Preview (sem elas, ele falha com a
   explicação no log). O site público dessas prévias funciona, porque os dados saem do
   servidor da Vercel. Já o painel chama a API pelo navegador, e a API responde **403** a
   uma origem que não está em `FRONTEND_URL`. Isso é proposital (CORS fechado). Para testar o painel numa prévia,
   acrescente a URL dela em `FRONTEND_URL`, separada por vírgula, e remova depois.

### Por que o segredo servidor-a-servidor

A API limita 300 requisições por minuto **por IP**. Quem busca os dados das páginas é o
servidor da Vercel, então todos os visitantes chegariam à API com o mesmo IP e um único
visitante abusivo derrubaria o site para todos. O servidor do site manda o cabeçalho
`X-Servidor-Site` com `SERVIDOR_SEGREDO`. Por isso, sem o segredo, a API não sobe em produção
e o build do site falha: avisar não bastaria, porque o site quebraria sob carga. O build
do site também falha sem `NEXT_PUBLIC_API_URL` ou com ela em `http://` (só `localhost` é
aceito sem TLS). A API reconhece o cabeçalho (comparação em tempo
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
passou `DEMO_RESET_MINUTOS`, restaura. Se uma imagem enviada sumiu do disco (o Render o
apaga ao dormir), só a referência sai do conteúdo, sem reset. O keep-alive só serve para o visitante não esperar a
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

## Produção real (site em uso pelo Cineclube XHY)

O site oficial é uma publicação **separada** da demonstração, do mesmo repositório e do
mesmo código (motivo e comparação no [ADR 0007](adr/0007-producao-e-demonstracao-separadas.md)):

| Peça | Produção | Demonstração (seções 0 a 6 acima) |
|---|---|---|
| Site | `https://cineclubexhy.vercel.app` | `https://cineclube-xhy.vercel.app` |
| API | `https://cineclubexhy-api.onrender.com`, Blueprint `render.producao.yaml` | `https://cineclube-xhy-api.onrender.com`, Blueprint `render.yaml` |
| Banco | Atlas, projeto próprio da produção, banco `cineclube_xhy` | `cineclube_demo` |
| Imagens | Cloudinary, pasta `cineclube-xhy` | disco temporário da API |

Na produção **não existe** `DEMO_ENABLED`: o painel exige a senha da equipe, `GET /api/demo`
responde 404, nada é apagado nem restaurado, e o site aparece nos buscadores.

### P0. Segredos da produção

Gere valores **novos**, diferentes dos da demonstração, com os mesmos comandos da seção 0:
`ADMIN_PASSWORD` (a senha que a equipe do cineclube vai usar no painel), `SERVIDOR_SEGREDO`
e a senha do usuário do Atlas. Guarde num gerenciador de senhas, nunca no repositório.

### P1. Banco no MongoDB Atlas

1. Crie um **projeto** próprio para a produção (separado do da demonstração) e nele um cluster **M0** na AWS
   Oregon (perto da API no Render).
2. **Database Access:** um usuário só da produção (nome à sua escolha) com o papel `readWrite` **só** no banco
   `cineclube_xhy` (não use `atlasAdmin` nem acesso a todos os bancos).
3. **Network Access:** `0.0.0.0/0`. O Render gratuito não tem IP fixo; a proteção fica com
   o usuário de senha forte e acesso a um banco só.
4. Copie a string de conexão e ponha o nome do banco:
   `mongodb+srv://<usuario>:<senha>@<cluster>.mongodb.net/cineclube_xhy?retryWrites=true&w=majority`
5. Não rode o seed: o banco começa vazio e a equipe cadastra o conteúdo pelo painel. Os
   índices são criados pela própria API ao subir.

### P2. Imagens no Cloudinary

1. Na conta do Cloudinary, copie a **API environment variable** (`cloudinary://API_KEY:API_SECRET@CLOUD_NAME`):
   ela é o `CLOUDINARY_URL` da API.
2. Anote o **Cloud name**: ele vai na Vercel como `CLOUDINARY_CLOUD_NAME`.
3. A pasta `cineclube-xhy` já vem do Blueprint (`CLOUDINARY_FOLDER`). Sem `CLOUDINARY_URL`, a
   API grava as imagens no disco do Render e elas somem a cada reinício (a API avisa no log).

### P3. API no Render, em workspace próprio

1. Crie um **workspace** novo (ex.: "Cineclube XHY"). As 750 horas gratuitas por mês valem
   por workspace: a produção acordada o mês inteiro gasta cerca de 744 h e não pode dividir
   a cota com a demonstração (ADR 0007).
2. **New → Blueprint**, escolha o repositório e, em **Blueprint Path**, `render.producao.yaml`.
   O serviço `cineclubexhy-api` vem com build, start, health check, `NODE_ENV=production`,
   `JWT_SECRET` gerado, `CLOUDINARY_FOLDER=cineclube-xhy` e `MONGODB_TIMEOUT_MS=30000`.
3. Preencha os valores `sync: false`:

| Variável | Valor |
|---|---|
| `MONGODB_URI` | a string do P1, com `/cineclube_xhy` |
| `ADMIN_PASSWORD` | a senha da equipe (12+ caracteres, senão a API não sobe) |
| `SERVIDOR_SEGREDO` | o segredo da produção (32+ caracteres); o mesmo valor vai na Vercel |
| `FRONTEND_URL` | `https://cineclubexhy.vercel.app` (some o domínio próprio, se houver, separado por vírgula) |
| `CLOUDINARY_URL` | a do P2 |

4. **Deploy automático depois dos testes:** no Render, *Settings → Deploy Hook*, copie a URL
   (é secreta: quem a tiver publica a API) e guarde no GitHub em *Settings → Secrets and
   variables → Actions → New repository secret*, com o nome `RENDER_DEPLOY_HOOK_PRODUCAO`.
   A cada push na `main` que mexa na API (`codigo-fonte/backend` ou este Blueprint), o job
   `deploy-producao` do CI chama o hook **só se os testes da API e do site passarem**. O
   Blueprint tem `autoDeploy: false`, então o Render nunca publica um commit sem testes.
   Para trocar o hook (se vazar), use *Regenerate* no Render e atualize o segredo.
5. Teste: `https://cineclubexhy-api.onrender.com/api/health` responde `db: connected`, e
   `https://cineclubexhy-api.onrender.com/api/demo` responde **404**.

### P4. Site na Vercel

1. Projeto novo `cineclubexhy`, **Root Directory = `codigo-fonte/frontend`**, domínio
   `cineclubexhy.vercel.app`.
2. Variáveis em **Production e Preview** (o `next build` das prévias também para sem elas):

| Variável | Valor |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://cineclubexhy-api.onrender.com` |
| `NEXT_PUBLIC_SITE_URL` | `https://cineclubexhy.vercel.app` |
| `SERVIDOR_SEGREDO` | o mesmo do Render da produção (só de servidor: nunca `NEXT_PUBLIC_`) |
| `CLOUDINARY_CLOUD_NAME` | o Cloud name do P2 |

3. **Não** defina `NEXT_PUBLIC_DEMO`. Sem ela, o site é indexável: o `robots.txt` libera
   tudo menos `/admin`, `/api/` e `/busca`, aponta o sitemap, e as páginas não levam
   `noindex` (`codigo-fonte/frontend/src/lib/indexacao.ts`, coberto por teste). O painel
   continua com `noindex` próprio.

### P5. Despertador

O Render gratuito dorme depois de 15 minutos sem tráfego. O site público continua no ar
(as páginas saem do cache da Vercel), mas a equipe esperaria a API acordar no painel.

- **Principal: cron-job.org.** Um job gratuito chamando
  `https://cineclubexhy-api.onrender.com/api/health` a cada 10 minutos.
- **Reserva: `keep-alive.yml`.** No GitHub, crie a variável `API_HEALTH_URL` com a mesma URL
  (*Settings → Secrets and variables → Actions → Variables*). Ele não é o principal: o
  GitHub **desativa agendamentos de repositórios públicos sem atividade por 60 dias**, e o
  agendamento pode atrasar em horários de pico. Se o GitHub avisar que desativou, reative
  em *Actions → keep-alive → Enable workflow*.

### P6. Backup do banco

O banco da produção tem o conteúdo real do cineclube. As imagens ficam no Cloudinary e não
entram neste backup.

- **Fazer:** no `codigo-fonte/backend`, com a string da produção só no comando:
  ```bash
  MONGODB_URI='mongodb+srv://...' npm run backup                 # Git Bash
  $env:MONGODB_URI='mongodb+srv://...'; npm run backup           # PowerShell
  ```
  Cria `backend/backups/AAAA-MM-DD-HHmm/` com um JSON por coleção (EJSON: ids e datas
  preservados) e um `manifesto.json`. A pasta está no `.gitignore`: **nunca** a envie ao
  GitHub. Guarde uma cópia fora do computador. Os comandos não mostram a URI no log.
- **Restaurar:** `MONGODB_URI='...' npm run restaurar -- backups/<pasta>`. Num banco com
  conteúdo, a restauração é recusada; `--substituir` apaga as coleções do backup e as repõe
  (use só quando for isso mesmo). Para conferir um backup sem risco, restaure num banco
  vazio de teste.
- Rode um backup antes de qualquer mudança grande (migração, troca de conta) e com uma
  frequência combinada com o cineclube.

### P7. Conferir a produção

- [ ] `https://cineclubexhy.vercel.app` abre; `/robots.txt` libera os buscadores e as páginas não têm `noindex`.
- [ ] `/admin/login` pede a senha e **não** mostra "Explore a demonstração"; `GET /api/demo` responde 404.
- [ ] No painel, criar um texto, ver no site (cache revalidado na hora) e excluir.
- [ ] Enviar uma imagem pelo painel: a URL é do Cloudinary e a imagem continua depois de reiniciar a API.
- [ ] A demonstração (`cineclube-xhy.vercel.app`) continua igual.
- [ ] `npm run backup` contra a produção gera os arquivos com o conteúdo criado no teste.
- [ ] `/como-foi-feito` e `/feed.xml` respondem 404, e o rodapé não tem "Este site" nem RSS (extras só da demonstração).

### P8. Operação do dia a dia

- **Trocar a senha da equipe** (por exemplo, quando alguém sai): altere `ADMIN_PASSWORD` no
  Render e salve com *Save, rebuild, and deploy*. Todas as sessões abertas caem na hora,
  inclusive a de quem saiu. A página "esqueci a senha" só manda falar com a coordenação:
  ela não descreve nada disso ao público.
- **IP real no limite por IP:** a API registra uma vez no log, ao receber o primeiro pedido,
  `[proxy] X-Forwarded-For com N endereço(s)` (só a contagem, nunca os IPs). O primeiro
  endereço é o do visitante e os outros são proxies; com N endereços, defina
  `PROXIES_CONFIAVEIS=N` no Render (padrão 1). Nunca mais do que os proxies que existem de
  fato: aí o visitante conseguiria forjar o próprio IP no cabeçalho.
