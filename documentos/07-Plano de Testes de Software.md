# Plano de Testes de Software

Os casos de teste abaixo verificam os requisitos da
[Especificação do Projeto](02-Especifica%C3%A7%C3%A3o%20do%20Projeto.md) na aplicação em
execução (API na porta 3001, site na porta 3000, banco MongoDB Atlas). Os testes funcionais
da API e do site foram executados com `curl`; os de interface, no Microsoft Edge com
emulação de dispositivos e com Puppeteer para medição automática. Todos os casos foram
elaborados por **Jefferson Luiz Mendonça da Silva**.

Os resultados estão no [Registro de Testes](08-Registro%20de%20Testes%20de%20Software.md).

| Caso de Teste | **CT-01 — Páginas de listagem respondem** |
|:---|:---|
| Requisitos associados | RF-001, RF-002, RF-004, RF-005, RF-006 |
| Objetivo | Verificar que a página inicial e as listagens de revista, catálogos, exibições e sobre carregam com sucesso. |
| Passos | 1. Requisitar `/`, `/revista`, `/catalogos`, `/ciclos-mostras`, `/sobre`. |
| Critérios de êxito | Todas respondem HTTP 200 com o conteúdo vindo da API. |

| Caso de Teste | **CT-02 — Páginas de detalhe respondem** |
|:---|:---|
| Requisitos associados | RF-002, RF-003, RF-004, RF-005 |
| Objetivo | Verificar sumário da revista, texto da revista, catálogo e ciclo existentes. |
| Passos | 1. Requisitar `/revista/2`, `/revista/2/artigo/<slug publicado>`, `/catalogos/<slug>`, `/ciclos-mostras/<slug>`. |
| Critérios de êxito | Todas respondem HTTP 200 e exibem título, autor e conteúdo. |

| Caso de Teste | **CT-03 — Conteúdo inexistente devolve 404 real** |
|:---|:---|
| Requisitos associados | RF-015 |
| Objetivo | Garantir que URLs de conteúdo inexistente respondam com status 404 (e não 200 com página de erro), tanto no site quanto na API. |
| Passos | 1. Requisitar `/revista/99/artigo/nao-existe`, `/catalogos/nao-existe`, `/qualquer-coisa`. 2. Requisitar `/api/revista/99/artigo/x`. |
| Critérios de êxito | Site responde HTTP 404 com a página "fim da sessão"; API responde HTTP 404 com JSON de erro. |

| Caso de Teste | **CT-04 — Login do editor** |
|:---|:---|
| Requisitos associados | RF-007 |
| Objetivo | Verificar que a senha errada é recusada e a correta devolve um token. |
| Passos | 1. `POST /api/auth/login` com `{"password":"errada"}`. 2. `POST /api/auth/login` com a senha configurada. |
| Critérios de êxito | Passo 1: HTTP 401 com mensagem "Senha incorreta". Passo 2: HTTP 200 com campo `token`. |

| Caso de Teste | **CT-05 — Rotas administrativas exigem token** |
|:---|:---|
| Requisitos associados | RF-007, RNF-003 |
| Objetivo | Garantir que rotas de escrita não são acessíveis sem autenticação válida. |
| Passos | 1. `GET /api/admin/revistas` sem cabeçalho. 2. Com `Authorization: Bearer abc`. 3. Com o token do CT-04. |
| Critérios de êxito | Passos 1 e 2: HTTP 401. Passo 3: HTTP 200 com a lista de edições. |

| Caso de Teste | **CT-06 — Upload de imagens** |
|:---|:---|
| Requisitos associados | RF-010, RNF-003 |
| Objetivo | Verificar que o upload exige autenticação, recusa arquivos que não são imagem e aceita PNG. |
| Passos | 1. `POST /api/upload` sem token. 2. Com token, enviar um arquivo de texto no campo `image`. 3. Com token, enviar um PNG. |
| Critérios de êxito | Passo 1: HTTP 401. Passo 2: HTTP 400 com mensagem listando os formatos aceitos. Passo 3: HTTP 200 com `url` da imagem. |

| Caso de Teste | **CT-07 — Rascunho não aparece no site** |
|:---|:---|
| Requisitos associados | RF-008, RF-011 |
| Objetivo | Verificar o ciclo de vida de um texto: rascunho invisível ao público, publicação o torna visível, exclusão o remove. |
| Passos | 1. Criar texto com `published: false` na edição nº 2. 2. Consultar `/api/admin/artigos?parentId=…` e `/api/revista/2`; requisitar a página pública do texto. 3. `PUT` com `published: true`; repetir consultas. 4. `DELETE` o texto; requisitar a página pública. |
| Critérios de êxito | Passo 2: aparece no admin, não aparece no sumário público, página pública 404. Passo 3: aparece no sumário, página pública 200. Passo 4: exclusão 200, página pública 404. |

| Caso de Teste | **CT-08 — Limite de tentativas de login** |
|:---|:---|
| Requisitos associados | RNF-003 |
| Objetivo | Garantir que tentativas repetidas de senha errada são bloqueadas. |
| Passos | 1. Enviar 11 requisições consecutivas a `POST /api/auth/login` com senha errada, do mesmo IP. |
| Critérios de êxito | As 10 primeiras respondem HTTP 401; a 11ª responde HTTP 429 com mensagem pedindo para aguardar. |

| Caso de Teste | **CT-09 — Metatags de compartilhamento** |
|:---|:---|
| Requisitos associados | RF-013 |
| Objetivo | Verificar que a página de um texto fornece título e metatags Open Graph. |
| Passos | 1. Requisitar a página de um texto publicado e inspecionar o `<head>`. |
| Critérios de êxito | `<title>` no formato "Título do texto \| Cineclube XHY"; presença de `og:title`, `og:description`, `og:url`, `og:type`, `og:image` e `og:image:alt`. |

| Caso de Teste | **CT-10 — robots.txt e sitemap.xml** |
|:---|:---|
| Requisitos associados | RF-014 |
| Objetivo | Verificar geração automática dos arquivos de indexação e bloqueio do painel. |
| Passos | 1. Requisitar `/robots.txt` e `/sitemap.xml`. |
| Critérios de êxito | Ambos HTTP 200; `robots.txt` contém `Disallow: /admin`; `sitemap.xml` lista as páginas fixas e as edições, catálogos e ciclos cadastrados. |

| Caso de Teste | **CT-11 — Redirecionamento da rota antiga** |
|:---|:---|
| Requisitos associados | RF-003 |
| Objetivo | Garantir que links antigos no formato `/revista/[n]/[coluna]/[slug]` continuam funcionando. |
| Passos | 1. Requisitar `/revista/2/editorial/<slug>` sem seguir redirecionamentos. |
| Critérios de êxito | HTTP 308 com `Location` apontando para `/revista/2/artigo/<slug>`. |

| Caso de Teste | **CT-12 — Responsividade sem rolagem horizontal** |
|:---|:---|
| Requisitos associados | RNF-001 |
| Objetivo | Garantir que nenhuma página pública estoura a largura da tela em celular, tablet e desktop. |
| Passos | 1. Com Puppeteer, abrir as 10 páginas públicas (inicial, 3 listagens, sumário, texto, catálogo, ciclo, sobre, 404) em viewports de 375×812 (celular, DPR 2), 768×1024 (tablet) e 1440×900 (desktop). 2. Medir `document.documentElement.scrollWidth` e comparar com `clientWidth`. 3. Capturar telas para inspeção visual. |
| Critérios de êxito | `scrollWidth == clientWidth` em todas as 30 combinações; capturas sem texto ou imagem cortada. |

| Caso de Teste | **CT-13 — Compilação sem erros** |
|:---|:---|
| Requisitos associados | RNF-008 |
| Objetivo | Garantir que os dois projetos compilam sem erros de tipo. |
| Passos | 1. `npx tsc --noEmit` no backend. 2. `npx next build` no frontend. |
| Critérios de êxito | Ambos terminam com código 0; o build lista todas as rotas públicas e administrativas. |

## Casos adicionados na versão 1.3.0

A partir da 1.3.0 a maior parte da verificação é automatizada e roda sem banco externo
(`npm test` no backend e no frontend, também no CI). Os casos abaixo dizem o que cada
suíte garante; a verificação de telas foi feita no navegador (desktop 1200 px e celular
375 px) e o desempenho no teste de carga.

| Caso de Teste | **CT-14 — Suíte da API (rotas e regras)** |
|:---|:---|
| Requisitos associados | RF-001 a RF-012, RF-016, RF-017, RF-020, RF-023, RF-024, RNF-009, RNF-010 |
| Objetivo | Verificar rotas públicas, CRUD do painel, validação, busca, autores, RSS, sitemap, resumo, impacto da exclusão, sessões com `filmId` e criação concorrente com o mesmo título. |
| Passos | `cd codigo-fonte/backend && npm test` (node:test + supertest, MongoDB em memória). |
| Critérios de êxito | Todos os testes passam; nenhum teste toca `backend/data/db` nem a porta 27018. |

| Caso de Teste | **CT-15 — Segurança da API** |
|:---|:---|
| Requisitos associados | RNF-003, RNF-009 |
| Objetivo | CORS 403 para origem desconhecida, cabeçalhos (helmet), 404/400/413/503 em JSON, limitador geral e de login (por IP e global), segredo servidor-a-servidor, senha por hash, token de 8 h invalidado ao trocar a senha, segredo de desenvolvimento só com banco local, upload pelos bytes e falha de disco respondendo 500, links só `https:`/`mailto:`, filtros sem operadores do MongoDB, configuração de produção recusando segredos fracos. |
| Passos | Arquivos `seguranca.test.ts`, `revisao-seguranca.test.ts`, `upload.test.ts`, `admin-validacao.test.ts`. |
| Critérios de êxito | Todos os testes passam. |

| Caso de Teste | **CT-16 — Modo demonstração** |
|:---|:---|
| Requisitos associados | RF-021, ADR 0004 |
| Objetivo | Flag desligada por padrão (404), `GET /api/demo` sem senha, entrar como editor com um clique, reset que só popula banco vazio quando pedido e `DEMO_RESET_MINUTOS=0` desligando o reset. |
| Passos | `demo.test.ts`. |
| Critérios de êxito | Todos os testes passam. |

| Caso de Teste | **CT-17 — Regras do front** |
|:---|:---|
| Requisitos associados | RNF-002, RNF-007, RF-018, RF-022 |
| Objetivo | Contraste AA de todo par texto/fundo dos tokens, leitura da expiração do token, destino seguro depois do login (sem redirecionamento aberto), tempo de espera do limite de login, RSS válido e escapado, agrupamento por ano, sessão ligada ao filme, slug de autor igual ao da API, normalização de `?q=` repetido, filtro do token antes de revalidar, limpeza dos rascunhos ao sair e limitador por IP. |
| Passos | `cd codigo-fonte/frontend && npm test`. |
| Critérios de êxito | Todos os testes passam. |

| Caso de Teste | **CT-18 — Lint, formatação e build** |
|:---|:---|
| Requisitos associados | RNF-008 |
| Objetivo | Código sem erros de lint e formatado; build de produção do site sem a API no ar. |
| Passos | `npm run lint`, `npm run format:check` e `npm run build` nos dois projetos. |
| Critérios de êxito | Todos terminam com código 0. |

| Caso de Teste | **CT-19 — Status HTTP honestos no site** |
|:---|:---|
| Requisitos associados | RF-015, RF-019 |
| Objetivo | 404 real para conteúdo inexistente e "serviço indisponível" (500) com a API fora do ar, nunca lista vazia nem 404 falso. |
| Passos | Com o site em `next start`: requisitar `/revista/999` e `/revista/1/artigo/nada`; derrubar a API e requisitar páginas sem cache (cenário H11 da carga). |
| Critérios de êxito | 404 nas inexistentes; com a API fora, páginas em cache continuam servindo e as sem cache mostram "serviço indisponível". |

| Caso de Teste | **CT-20 — Fluxo do editor no navegador** |
|:---|:---|
| Requisitos associados | RF-020 a RF-023 |
| Objetivo | Login com erro anunciado; sessão expirada no meio de uma edição abre o re-login por cima e preserva o formulário; diálogo de exclusão com contagem; toasts de sucesso. |
| Passos | No navegador: senha errada; entrar; alterar um campo; invalidar o token; salvar; entrar de novo no diálogo; salvar de novo; abrir a exclusão de uma revista. |
| Critérios de êxito | Mensagens corretas, nenhum dado digitado perdido, nenhuma janela nativa (`alert`/`confirm`). |

| Caso de Teste | **CT-21 — Teste de carga antes/depois** |
|:---|:---|
| Requisitos associados | RNF-004 |
| Objetivo | Validar ou refutar as hipóteses H1 a H11 registradas antes de medir. |
| Passos | `node carga/rodar.mjs --rotulo antes` (no código anterior às correções) e `--rotulo depois`; `node carga/relatorio.mjs`. |
| Critérios de êxito | Relatório em `docs/carga/2026-10-04-resultados.md` com cada hipótese confirmada ou refutada. |
