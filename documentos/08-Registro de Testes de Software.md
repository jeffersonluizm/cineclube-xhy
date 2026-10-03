# Registro de Testes de Software

Relatório de execução do [Plano de Testes](07-Plano%20de%20Testes%20de%20Software.md).
Todos os casos foram executados por **Jefferson Luiz Mendonça da Silva** em
**15/09/2026**, na versão 1.2.0, com a API em `http://localhost:3001` conectada ao MongoDB
Atlas e o site em `http://localhost:3000` rodando o build de produção (`next build` +
`next start`).

## Resumo

| Caso | Título | Resultado |
|---|---|---|
| CT-01 | Páginas de listagem respondem | ✅ Aprovado |
| CT-02 | Páginas de detalhe respondem | ✅ Aprovado |
| CT-03 | Conteúdo inexistente devolve 404 real | ✅ Aprovado (após correção) |
| CT-04 | Login do editor | ✅ Aprovado |
| CT-05 | Rotas administrativas exigem token | ✅ Aprovado |
| CT-06 | Upload de imagens | ✅ Aprovado |
| CT-07 | Rascunho não aparece no site | ✅ Aprovado |
| CT-08 | Limite de tentativas de login | ✅ Aprovado |
| CT-09 | Metatags de compartilhamento | ✅ Aprovado |
| CT-10 | robots.txt e sitemap.xml | ✅ Aprovado |
| CT-11 | Redirecionamento da rota antiga | ✅ Aprovado |
| CT-12 | Responsividade sem rolagem horizontal | ✅ Aprovado (após correção) |
| CT-13 | Compilação sem erros | ✅ Aprovado |

## Detalhamento

| Caso de Teste | **CT-01 — Páginas de listagem respondem** |
|:---|:---|
| Resultados obtidos | `/` 200 · `/revista` 200 · `/catalogos` 200 · `/ciclos-mostras` 200 · `/sobre` 200 |
| Evidência | ![Página inicial](img/site-home-desktop.png) |

| Caso de Teste | **CT-02 — Páginas de detalhe respondem** |
|:---|:---|
| Resultados obtidos | `/revista/2` 200 · `/revista/2/artigo/publicacao-de-teste-do-editor` 200 · `/catalogos/julio-bressane` 200 · `/ciclos-mostras/o-tempo-do-depois` 200 |
| Evidência | ![Sumário](img/site-revista-sumario.png) ![Ciclo](img/site-ciclo.png) |

| Caso de Teste | **CT-03 — Conteúdo inexistente devolve 404 real** |
|:---|:---|
| Resultados obtidos | **1ª execução (reprovado):** `/revista/99/artigo/nao-existe` respondeu HTTP **200** com a página 404 e `<meta name="robots" content="noindex">`. Causa: um `loading.tsx` na raiz fazia o Next.js transmitir a página em streaming, enviando o status antes de `notFound()` ser chamado. **Correção:** páginas de listagem movidas para o grupo de rotas `(listas)`, único que possui `loading.tsx`; páginas de detalhe ficaram fora dele. **2ª execução (aprovado):** artigo inexistente **404** · catálogo inexistente **404** · rota aleatória **404** · API `/api/revista/99/artigo/x` **404**. |
| Evidência | ![Página 404](img/site-404-celular.png) |

| Caso de Teste | **CT-04 — Login do editor** |
|:---|:---|
| Resultados obtidos | Senha errada: `{"error":"Senha incorreta"}` HTTP **401**. Senha correta: HTTP **200** com `token` recebido. |
| Evidência | ![Tela de login](img/admin-login.png) |

| Caso de Teste | **CT-05 — Rotas administrativas exigem token** |
|:---|:---|
| Resultados obtidos | Sem token: **401** · token inválido (`Bearer abc`): **401** · token válido: **200** com a lista de edições. |
| Evidência | ![Painel de revistas](img/admin-revistas.png) |

| Caso de Teste | **CT-06 — Upload de imagens** |
|:---|:---|
| Resultados obtidos | Sem token: **401**. Arquivo de texto (`text/plain`) com token: **400** `{"error":"Apenas imagens são permitidas (jpg, png, webp, gif, avif, svg)"}`. PNG com token: **200** `{"url":"/uploads/1789524600007-logo-xhy.png"}` (ambiente local, sem Cloudinary). |
| Evidência | ![Editor de blocos com upload](img/admin-editor-blocos.png) |

| Caso de Teste | **CT-07 — Rascunho não aparece no site** |
|:---|:---|
| Resultados obtidos | Criado texto `rascunho-de-teste-ct-08` com `"published":false` na edição nº 2. **Rascunho:** no admin 1 ocorrência · no sumário público 0 · página pública **404**. **Após `PUT {"published":true}` (200):** no sumário público 1 · página pública **200**. **Após `DELETE` (200):** página pública **404**. |

| Caso de Teste | **CT-08 — Limite de tentativas de login** |
|:---|:---|
| Resultados obtidos | 11 requisições com senha errada: `401 401 401 401 401 401 401 401 401 401 429`. A 11ª devolveu `{"error":"Muitas tentativas de login. Aguarde alguns minutos e tente novamente."}`. Observação: o bloqueio afetou o próprio ambiente de teste por 15 minutos, confirmando que vale também para o cliente legítimo do mesmo IP; a API foi reiniciada para prosseguir. |

| Caso de Teste | **CT-09 — Metatags de compartilhamento** |
|:---|:---|
| Resultados obtidos | `<title>Publicação de teste do editor \| Cineclube XHY</title>`. Seis metatags Open Graph presentes: `og:title`, `og:description`, `og:url`, `og:type`, `og:image`, `og:image:alt`. |

| Caso de Teste | **CT-10 — robots.txt e sitemap.xml** |
|:---|:---|
| Resultados obtidos | `/robots.txt` **200** com `Disallow: /admin` · `/sitemap.xml` **200** com **17 URLs** (5 fixas + edições, catálogos e ciclos cadastrados). |

| Caso de Teste | **CT-11 — Redirecionamento da rota antiga** |
|:---|:---|
| Resultados obtidos | `/revista/2/editorial/publicacao-de-teste-do-editor` → HTTP **308**, `Location: /revista/2/artigo/publicacao-de-teste-do-editor`. |

| Caso de Teste | **CT-12 — Responsividade sem rolagem horizontal** |
|:---|:---|
| Resultados obtidos | **1ª execução (reprovado):** três medições com `scrollWidth > clientWidth` na página inicial (1971 px) e no catálogo em tablet (1928 px), causadas pela imagem da capa medida antes da folha de estilo aplicar a largura do contêiner. **2ª execução (aprovado):** 30 combinações (10 páginas × 3 viewports) com `scrollWidth == clientWidth`; saída do script: "Sem overflow horizontal em nenhuma página". Inspeção visual das capturas sem cortes. Ajuste adicional: menu da página inicial passou a ocupar linha própria no celular. |
| Evidência | ![Home no celular](img/site-home-celular.png) ![Texto no celular](img/site-artigo-celular.png) |

| Caso de Teste | **CT-13 — Compilação sem erros** |
|:---|:---|
| Resultados obtidos | Backend: `tsc --noEmit` código 0. Frontend: `next build` → "✓ Compiled successfully", "✓ Generating static pages (20/20)", 33 rotas listadas, JavaScript inicial das páginas públicas entre 87 kB e 101 kB. |

## Defeitos encontrados e corrigidos durante os testes

| # | Defeito | Correção |
|---|---|---|
| 1 | Links dos textos de catálogo apontavam para `/catalogos/<slug>/texto/<texto>`, rota inexistente (404). | Links e navegação anterior/seguinte passaram a usar `/catalogos/<slug>/<texto>`. |
| 2 | Páginas de conteúdo inexistente respondiam 200 (CT-03). | Grupo de rotas `(listas)` isolando o `loading.tsx`. |
| 3 | Menu da página inicial empilhava em coluna ao lado do logo no celular. | `TopNav` com o menu em linha própria abaixo de 640 px. |
