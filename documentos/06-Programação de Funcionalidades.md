# Programação de Funcionalidades

Este documento descreve as funcionalidades implementadas, relacionando cada uma aos
requisitos da [Especificação do Projeto](02-Especifica%C3%A7%C3%A3o%20do%20Projeto.md),
aos arquivos que a implementam, à estrutura de dados envolvida e à forma de acesso.
Todas as funcionalidades foram desenvolvidas por **Jefferson Luiz Mendonça da Silva**.

## Estrutura de dados

O conteúdo é armazenado no MongoDB em seis coleções, definidas com Mongoose em
`codigo-fonte/backend/src/models/`:

| Coleção | Modelo | Campos principais |
|---|---|---|
| `magazines` | `Magazine` | `number` (único), `volume`, `month`, `year`, `coverImage`, `editorial`, `slug` |
| `articles` | `Article` | `title`, `slug` (único), `author`, `column`, `epigraph`, `blocks[]`, `content` (texto puro derivado dos blocos), `footnotes[]`, `coverImage`, `published`, `order`, `parentType` (`revista` / `catalogo` / `ciclo`), `parentId` |
| `catalogs` | `Catalog` | `title`, `slug`, `year`, `coverImage`, `description` |
| `cycles` | `Cycle` | `title`, `subtitle`, `slug`, `year`, `coverImage`, `description`, `author`, `epigraph`, `footnotes[]`, `authorFootnote`, `screenings[]` (`date`, `time`, `filmTitle`, `filmId` (página do filme), `filmSlug` (sessões antigas), `director`, `duration`, `country`) |
| `films` | `Film` | `title`, `slug`, `director`, `year`, `duration`, `country`, `image`, `synopsis`, `content`, `author`, `authorFootnote`, `epigraph`, `footnotes[]`, `cycleId`, `order` |
| `abouts` | `About` | `blocks[]`, `content`, `team[]` (`name`, `role`, `email`, `links[]`) |

Um **bloco** de texto (`blockSchema`) tem a forma:

```ts
{
  type: 'paragraph' | 'subtitle' | 'quote' | 'image',
  text?: string,                                   // parágrafo, subtítulo, citação
  src?: string, caption?: string,                  // imagem
  align?: 'full' | 'left' | 'right' | 'center',    // imagem
  width?: 'small' | 'medium' | 'large'             // imagem
}
```

Índices: `Article` por (`parentType`, `parentId`, `published`, `order`) e (`published`,
`createdAt`), mais um índice de texto (título, autor, corpo); `Film` por (`cycleId`,
`order`) e índice de texto (título, direção, sinopse).

A API (`codigo-fonte/backend/src/routes/`) expõe rotas públicas de leitura
(`/api/home`, `/api/revista`, `/api/catalogos`, `/api/ciclos`, `/api/sobre`, `/api/busca`,
`/api/autores`, `/api/recentes`, `/api/mapa`) e rotas protegidas de escrita (`/api/auth`,
`/api/upload`, `/api/admin/*`, uma por recurso em `routes/admin/`). A lista completa está
no [README do código-fonte](../codigo-fonte/README.md#api).

---

## Página inicial — prateleira de edições

![Página inicial no desktop](img/site-home-desktop.png)

**Requisito atendido:** RF-001.

**Artefatos:** `frontend/src/app/(listas)/page.tsx`, `components/HomeShowcase.tsx`,
`components/TopNav.tsx`; `backend/src/routes/home.ts`.

**Funcionamento:** a rota `/api/home` devolve a publicação mais recente (revista ou
catálogo, pelo `createdAt`) e todas as edições da revista com seus textos publicados. O
componente `HomeShowcase` empilha as edições; roda do mouse, gesto de deslizar, teclado,
setas e pontos alternam a edição em exibição com transição animada. A página ocupa a
altura da tela e não rola.

**Acesso:** `/`.

---

## Revista — listagem, sumário e leitura

| Listagem por ano | Sumário da edição |
|---|---|
| ![Listagem da revista](img/site-revista-lista.png) | ![Sumário da revista](img/site-revista-sumario.png) |

![Texto da revista](img/site-artigo.png)

**Requisitos atendidos:** RF-002, RF-003, RF-011 (só textos publicados aparecem).

**Artefatos:** `frontend/src/app/(listas)/revista/page.tsx`,
`app/revista/[number]/page.tsx`, `app/revista/[number]/artigo/[slug]/page.tsx`,
`components/ArticleBody.tsx`, `components/ArticleNav.tsx`, `components/Breadcrumb.tsx`;
`backend/src/routes/revista.ts`.

**Funcionamento:** a listagem agrupa edições por ano em ordem decrescente. O sumário
mostra capa, trecho do editorial e textos agrupados por coluna. A página do texto renderiza
os blocos com `ArticleBody`: epígrafe à direita, imagens com legenda e alinhamento, notas
na coluna lateral (desktop) ou após o texto (celular), e navegação para o texto anterior e
o seguinte. A rota antiga `/revista/[n]/[coluna]/[slug]` redireciona permanentemente
(HTTP 308) para o endereço canônico.

**Acesso:** `/revista`, `/revista/2`, `/revista/2/artigo/<slug>`.

---

## Catálogos

![Catálogo](img/site-catalogo.png)

**Requisitos atendidos:** RF-004, RF-011.

**Artefatos:** `frontend/src/app/(listas)/catalogos/page.tsx`,
`app/catalogos/[slug]/page.tsx`, `app/catalogos/[slug]/[textSlug]/page.tsx`;
`backend/src/routes/catalogos.ts`.

**Funcionamento:** mesma lógica da revista, com textos agrupados por seção e página de
leitura em fundo escuro. Os textos de catálogo são documentos `Article` com
`parentType: 'catalogo'`.

**Acesso:** `/catalogos`, `/catalogos/<slug>`, `/catalogos/<slug>/<texto>`.

---

## Exibições — ciclos, programação e filmes

![Ciclo com programação](img/site-ciclo.png)

**Requisito atendido:** RF-005.

**Artefatos:** `frontend/src/app/(listas)/ciclos-mostras/page.tsx`,
`app/ciclos-mostras/[slug]/page.tsx`, `app/ciclos-mostras/[slug]/[filmSlug]/page.tsx`;
`backend/src/routes/ciclos.ts`.

**Funcionamento:** o ciclo exibe título, subtítulo, capa, apresentação, autor e a
programação de sessões, os textos publicados do ciclo e as notas (a nota do autor vira a
nota 1, com chamada ao lado do nome). Cada sessão aponta para a página do filme escolhida
no painel (`filmId`; sessões antigas continuam pelo `filmSlug`), com ficha técnica, imagem,
epígrafe, sinopse, texto crítico, notas e navegação entre filmes do ciclo.

**Acesso:** `/ciclos-mostras`, `/ciclos-mostras/<slug>`, `/ciclos-mostras/<slug>/<filme>`, `/ciclos-mostras/<slug>/texto/<texto>`.

---

## Sobre — apresentação e equipe

![Página sobre](img/site-sobre.png)

**Requisito atendido:** RF-006.

**Artefatos:** `frontend/src/app/(listas)/sobre/page.tsx`, `components/BlockContent.tsx`,
`components/Credit.tsx`; `backend/src/routes/sobre.ts`.

**Funcionamento:** o texto de apresentação é renderizado em blocos sobre fundo claro. A
equipe é agrupada por função, com e-mail e links externos por integrante. O desenvolvedor
do site aparece como último grupo, na mesma diagramação.

**Acesso:** `/sobre`.

---

## Painel do editor — autenticação

![Tela de login](img/admin-login.png)

**Requisito atendido:** RF-007; RNF-003.

**Artefatos:** `frontend/src/app/admin/login/page.tsx`, `app/admin/layout.tsx`,
`lib/adminApi.ts`; `backend/src/routes/auth.ts`, `middleware/auth.ts`.

**Funcionamento:** o editor informa a senha única (`ADMIN_PASSWORD`). A API compara em
tempo constante (hash SHA-256 dos dois lados) e devolve um token JWT válido por 8 horas,
guardado no `localStorage`. Toda rota `/api/admin/*` e `/api/upload` exige o cabeçalho
`Authorization: Bearer <token>`. O login aceita no máximo 10 tentativas erradas por IP a
cada 15 minutos; a partir daí responde 429. Desde a versão 1.3.0, a expiração não manda
mais o editor para o login perdendo o formulário: ver "páginas de conexão e sessão" abaixo.

**Acesso:** `/admin/login`.

---

## Painel do editor — revistas e textos

| Lista de edições | Edição: dados, capa e textos |
|---|---|
| ![Painel: revistas](img/admin-revistas.png) | ![Painel: edição da revista](img/admin-revista-edicao.png) |

**Requisitos atendidos:** RF-008, RF-011, RF-012.

**Artefatos:** `frontend/src/app/admin/page.tsx`, `app/admin/revistas/nova/page.tsx`,
`app/admin/revistas/[id]/page.tsx`, `app/admin/revistas/[id]/artigos/novo/page.tsx`,
`components/admin/MagazineForm.tsx`; `backend/src/routes/admin.ts`.

**Funcionamento:** CRUD de edições (número único, volume, mês, ano, capa, editorial). Na
página da edição o editor cria textos, alterna entre rascunho e publicado, reordena por
arrastar (`PUT /api/admin/artigos/reorder`) e exclui. Excluir uma edição remove seus textos.

**Acesso:** `/admin` → edição → textos.

---

## Painel do editor — editor de blocos e upload de imagens

![Editor de blocos](img/admin-editor-blocos.png)

**Requisitos atendidos:** RF-009, RF-010; RNF-006.

**Artefatos:** `frontend/src/components/admin/ArticleEditor.tsx`,
`components/admin/BlocksEditor.tsx`, `components/admin/ImageUploadField.tsx`;
`backend/src/routes/upload.ts`.

**Funcionamento:** o texto é composto por blocos de parágrafo, subtítulo, citação e
imagem, reordenáveis por arrastar (punho ⠿) ou setas. Blocos de imagem aceitam legenda,
largura (pequena, média, grande) e alinhamento (total, centro, esquerda, direita). O upload
aceita jpg, png, webp, gif e avif (SVG é recusado) até 10 MB; com `CLOUDINARY_URL` configurada a
imagem vai para o Cloudinary e a URL devolvida é absoluta; sem ela, fica em
`backend/uploads/`. Ao salvar, a API gera `content` (texto puro) a partir dos blocos para
trechos e buscas.

**Acesso:** `/admin/artigos/<id>` (também usado por textos de catálogo).

---

## Painel do editor — catálogos, exibições e filmes

| Lista de ciclos | Ciclo: dados, programação e filmes |
|---|---|
| ![Painel: exibições](img/admin-ciclos.png) | ![Painel: ciclo](img/admin-ciclo-programacao.png) |

**Requisitos atendidos:** RF-008, RF-012.

**Artefatos:** `frontend/src/app/admin/catalogos/**`, `app/admin/ciclos/**`,
`app/admin/filmes/[id]/page.tsx`, `components/admin/CatalogForm.tsx`,
`components/admin/CycleForm.tsx`, `components/admin/FilmForm.tsx`;
`backend/src/routes/admin.ts`.

**Funcionamento:** catálogos têm capa, descrição e textos por seção (mesmo editor de
blocos). Ciclos têm dados, epígrafe, notas, programação de sessões editável linha a linha e
páginas de filmes reordenáveis. Excluir um ciclo remove seus filmes e textos.

**Acesso:** `/admin/catalogos`, `/admin/ciclos`.

---

## Painel do editor — sobre

**Requisitos atendidos:** RF-006, RF-008.

**Artefatos:** `frontend/src/app/admin/sobre/page.tsx`, `components/admin/AboutForm.tsx`;
`backend/src/routes/admin.ts` (`/api/admin/sobre`).

**Funcionamento:** edição do texto de apresentação em blocos e da equipe (nome, função,
e-mail, links). O documento `About` é único e criado na primeira gravação.

**Acesso:** `/admin/sobre`.

---

## Compartilhamento, indexação e erros

![Página 404 no celular](img/site-404-celular.png)

**Requisitos atendidos:** RF-013, RF-014, RF-015.

**Artefatos:** `frontend/src/app/layout.tsx` (metadata padrão, fontes, `maxDuration`),
`lib/seo.ts`, `generateMetadata` em cada página de detalhe, `app/robots.ts`,
`app/sitemap.ts`, `app/not-found.tsx`, `app/error.tsx`, `app/global-error.tsx`,
`app/icon.png`.

**Funcionamento:** cada página de detalhe gera título, descrição, URL canônica e imagem
Open Graph a partir do conteúdo (capa da edição, do catálogo, do ciclo ou do filme). O
`sitemap.xml` lista páginas fixas e todas as edições, catálogos e ciclos; o `robots.txt`
bloqueia `/admin` (que também tem `noindex`). Desde a versão 1.3.0 o sitemap inclui
textos, filmes e autores (via `/api/mapa`). As páginas de conteúdo não usam
`loading.tsx`: com streaming o Next envia 200 antes de saber se a página existe, e o 404
deixaria de ser real; o cache de 60 s torna a espera rara.

**Acesso:** qualquer URL pública; `/robots.txt`; `/sitemap.xml`.

---

## Busca, autores e RSS (1.3.0)

![Busca](../docs/img/05-busca.jpg)

**Requisitos atendidos:** RF-016, RF-017, RF-018.

**Artefatos:** `frontend/src/app/busca/page.tsx`, `app/autores/`, `app/feed.xml/route.ts`,
`lib/rss.ts`; `backend/src/routes/descoberta.ts`, `lib/enderecos.ts`, índices de texto em
`models/Article.ts` e `models/Film.ts`.

**Funcionamento:** a busca usa índices de texto do MongoDB (título pesa mais que autor, que
pesa mais que o corpo; sem acentos) só nos textos publicados e nos filmes, e devolve o
endereço de cada resultado com os pais carregados numa consulta por tipo. A página de autor
junta as grafias do mesmo nome pelo slug. O RSS lista os 30 textos mais recentes.

**Acesso:** `/busca?q=`, `/autores`, `/autores/<slug>`, `/feed.xml`.

---

## Painel do editor: início, páginas de conexão e sessão (1.3.0)

| Início | Sessão expirada |
|---|---|
| ![Início do painel](../docs/img/08-painel-inicio.jpg) | ![Sessão expirada](../docs/img/07-sessao-expirada.jpg) |

**Requisitos atendidos:** RF-020, RF-021, RF-022.

**Artefatos:** `frontend/src/app/admin/page.tsx`, `app/admin/{login,recuperar-senha,sessao-expirada,sair}/`,
`components/admin/{PainelShell,Sessao,FormularioSenha,TelaConexao}.tsx`, `lib/sessao.ts`,
`lib/login.ts`; `backend/src/routes/admin/resumo.ts`, `routes/auth.ts` (`/sessao`).

**Funcionamento:** o início mostra contagens, rascunhos e últimos editados. O login tem
mostrar senha, autocomplete, aviso de Caps Lock, erro anunciado ao leitor de tela, contagem
regressiva quando o limite de tentativas é atingido (lida do cabeçalho `RateLimit`) e volta
para a página de origem (`?next=`, só caminhos do painel). A sessão dura 8 horas; o painel
avisa 10 minutos antes. Se a API recusar o token no meio de uma edição, uma janela pede a
senha por cima da página e o formulário continua preenchido.

---

## Painel do editor: exclusão, avisos e rascunho local (1.3.0)

![Exclusão em cascata](../docs/img/11-exclusao-em-cascata.jpg)

**Requisito atendido:** RF-023.

**Artefatos:** `components/admin/{Dialogo,Toasts,ListaReordenavel,AvisoSaida,hooks}.tsx`;
`backend/src/routes/admin/*` (`GET /:id/impacto`).

**Funcionamento:** excluir revista, catálogo ou exibição mostra quantos textos e páginas
de filme vão junto e pede para digitar o nome. Reordenar muda a tela na hora e volta se a
API falhar. Toda ação termina com um aviso de sucesso ou erro. O editor de textos guarda
um rascunho no navegador e oferece restaurar; sair com alterações não salvas pede
confirmação num diálogo próprio.

---

## Segurança, validação e cache (1.3.0)

**Requisitos atendidos:** RF-019, RNF-003, RNF-004, RNF-009.

**Artefatos:** `backend/src/app.ts`, `middleware/{erros,limitadores,auth}.ts`,
`validacao/esquemas.ts`, `lib/{senha,links,imagem}.ts`; `frontend/next.config.js`,
`lib/api.ts`, `app/api/revalidar/route.ts`, `app/error.tsx`, `app/global-error.tsx`.

**Funcionamento:** a API usa helmet, CORS com 403 para origem desconhecida, limite geral
por IP, senha comparada por hash, token HS256 de 8 h e upload conferido pelos bytes; toda
entrada do painel passa por zod. O site manda CSP e cabeçalhos de segurança. As páginas
guardam as respostas da API por 60 s e o painel chama `/api/revalidar` depois de cada
alteração. Se a API cai, a página diz "serviço indisponível" (status 500) em vez de uma
lista vazia ou de um 404 falso.

---

## Responsividade

| Celular (375 px) | Desktop |
|---|---|
| ![Texto no celular](img/site-artigo-celular.png) | ![Texto no desktop](img/site-artigo.png) |

**Requisito atendido:** RNF-001.

**Artefatos:** `frontend/src/components/PageShell.tsx`, `components/Sidebar.tsx`,
`components/TopNav.tsx`, `components/HomeShowcase.tsx`, `components/ArticleBody.tsx`,
`app/globals.css`, `tailwind.config.ts`.

**Funcionamento:** descrito em [Template padrão da Aplicação](05-Template%20padr%C3%A3o%20da%20Aplica%C3%A7%C3%A3o.md#responsividade).
