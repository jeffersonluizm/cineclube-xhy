# Hipóteses da carga (registradas antes de qualquer medição)

Data: 04/10/2026. Código medido na linha de base: `main` (v1.2.0 + textos de ciclo), sem nenhuma
correção de desempenho. Harness: `carga/rodar.mjs` (k6 2.2.0, MongoDB 8.2.6 em memória na porta
27200, API compilada na 3201 com diretório de trabalho fora do repositório, site com `next start`
na 3200). Massa: 30 revistas × 15 textos de 25 blocos (~15 kB cada), 10 catálogos × 10 textos,
20 ciclos × 25 filmes + 5 textos (650 textos, 500 filmes).

Protocolo por cenário: aquecimento de 5 s com 10 VUs (descartado) e degraus de 10, 50, 100 e
200 VUs de 15 s cada. Ponto de quebra: primeiro degrau com p95 acima de 1 s ou mais de 1% de
erros. CPU e memória amostradas por processo a cada segundo. Gerador e servidores dividem a mesma
máquina (Ryzen 5 5600, 6 núcleos/12 threads, 16 GB): os números valem para comparar antes e depois.

| Id | Alvo | Hipótese (antes) | Esperado depois da correção |
|---|---|---|---|
| H1 | `GET /api/health` | Linha de base sem banco: acima de 3.000 req/s com 50 VUs e p95 abaixo de 15 ms; sem quebra até 200 VUs. | Igual (controle); helmet acrescenta só cabeçalhos. |
| H2 | `GET /api/home` com 1, 10 e 30 revistas | N+1: 4 + N consultas por requisição (34 com 30 revistas). Com 30 revistas a vazão em 50 VUs fica abaixo de 1/4 da vazão com 1 revista e o p95 passa de 200 ms. | Consultas constantes (no máximo 5) e vazão com 30 revistas pelo menos 2× maior. |
| H3 | `GET /api/revista/30` | Devolve os 14 textos publicados completos (blocos e `content`): mais de 200 kB por resposta; serialização domina o p95. | Sumário só com os campos usados: resposta com menos da metade do tamanho e vazão pelo menos 2× maior. |
| H4 | artigo da revista e texto do ciclo | 3 consultas, uma delas carregando todos os textos completos só para achar anterior/próximo; custo cresce com o tamanho da edição. | Lista de vizinhos só com título/slug/autor: vazão pelo menos 1,5× maior. |
| H5 | ciclo e filme | Sem índice em `Film.cycleId` e `Article.parentId`, cada consulta varre a coleção (500 filmes, 650 textos). | Com índices compostos o ganho é pequeno nesse volume (estimado 1,3×): o volume do cineclube é baixo, e a hipótese é que índice aqui é seguro mas não decisivo. |
| H6 | `POST /api/auth/login` | Senha certa não entra no limite (`skipSuccessfulRequests`): mais de 1.000 req/s. Senha errada: 10 respostas 401 e as 20 seguintes 429. | Mesmo comportamento (o hash da senha antes da comparação não muda a vazão de forma perceptível) e o limitador geral responde 429 quando ligado. |
| H7 | `POST /api/admin/artigos` com o mesmo título | `uniqueSlug` faz k consultas para o k-ésimo título repetido e tem corrida até gravar: com 10 VUs aparecem respostas 500 (E11000) e a latência cresce ao longo da rodada. | Zero 500 e consultas constantes por criação. |
| H8 | `PUT /api/admin/artigos/reorder` com 50 ids | 50 `findByIdAndUpdate` em paralelo por requisição: p95 acima de 100 ms com 50 VUs. | `bulkWrite` único: vazão pelo menos 2× maior. |
| H9 | site (`/`, `/revista`, sumário, artigo, ciclo) | Com `cache: 'no-store'` toda página renderiza no servidor e chama a API: vazão do site menor ou igual à da rota de API usada, p95 do site entre 20 e 50 ms acima do p95 da API; a home com 30 revistas quebra (p95 > 1 s) em até 100 VUs. | Ver H10. |
| H10 | site com cache | (medido no "depois") | Com `revalidate` de 60 s e revalidação sob demanda ao salvar no painel: pelo menos 10× mais req/s, p95 abaixo de 50 ms com 50 VUs e quase nenhuma consulta ao banco em regime. |
| H11 | site com a API fora do ar | Páginas de detalhe respondem 404 ("fim da sessão") e listas respondem 200 com "Nenhuma … disponível": o visitante recebe uma informação falsa. | Páginas sem cache respondem 503 com "serviço indisponível" e botão de tentar de novo; páginas já em cache continuam servindo o conteúdo. |
