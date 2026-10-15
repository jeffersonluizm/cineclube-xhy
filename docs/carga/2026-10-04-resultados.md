# Teste de carga: resultados antes e depois

- **Hipóteses:** registradas antes de medir em [2026-10-04-hipoteses.md](2026-10-04-hipoteses.md), commit `13083c3`.
- **Antes:** código anterior às correções (commit `6332309`, num worktree), medido em 14/10/2026 de 22:56 a 23:13. H1 a H4 foram medidos de novo em 15/10, de 02:28 a 02:37 (ver limitações).
- **Depois:** commit `7d06e4c`, medido em 15/10/2026 de 00:25 a 00:42.
- **Ferramentas:** harness `carga/rodar.mjs` (k6 2.2.0 e MongoDB 8.2.6 em memória na porta 27200), relatório `carga/relatorio.mjs`.
- **Ambiente isolado:** a API compilada roda com o diretório de trabalho fora do repositório, então nenhum `.env` real é lido. O site faz `next build` apontando para a API de teste e sobe com `next start` na porta 3200.
- **Massa:** 30 revistas com 15 textos de 25 blocos cada, 10 catálogos, 20 ciclos com 25 filmes, 650 textos e 500 filmes.
- **Protocolo:** 5 s de aquecimento, depois degraus de 10, 50, 100 e 200 VUs, 15 s em cada.
- **Uma carga por vez:** o harness compila primeiro e só então pega a trava compartilhada da oficina (`.carga-lock`, com `dono.json`). Mede segurando a trava e a libera no fim. Os horários de início e fim de cada medição ficam em `meta.medicaoInicio` e `meta.medicaoFim` do `resultados.json`.

> **Por que estes números substituem os de 04/10 e 13/10**
>
> As duas primeiras rodadas mediram **sem a trava**. De `6332309` até `e0060d1`, o caminho
> estava numa string JS com barras invertidas simples (`'E:\Faculdade\...'`). O JavaScript lia
> isso como `E:FaculdadeProjeto - ...`, um caminho relativo à pasta atual da unidade E:. O
> harness criava uma pasta errada e nunca via a trava das outras cargas, que mediram ao mesmo
> tempo: em 04/10 a partir de 18:27:07 e em 13/10 a partir de 21:56:39. As duas rodadas
> foram descartadas (ficam fora do Git, em `carga/resultados/*-colidiu`). Os horários de
> todas as rodadas ficam num registro de janelas de carga mantido fora deste repositório,
> no espaço de trabalho onde as cargas de vários projetos dividiram a mesma máquina.

> **Limitações desta medição**
>
> - **Mesma máquina:** o gerador (k6), a API, o site e o MongoDB dividem um Ryzen 5 5600
>   (6 núcleos, 12 threads) com 16 GB. Os números servem para **comparar as duas versões**,
>   não para estimar capacidade de produção.
> - **H1 a H4 da rodada "antes" foram medidos de novo.** Em 14/10, entre 22:56 e 23:04,
>   outro projeto rodou testes, um `iniciar.bat` e um roteiro de navegador sem pegar a
>   trava, e às 23:04:43 um `npm test` rodou por alguns segundos (no meio do H4-ciclo). Esses
>   cenários foram repetidos em 15/10, de 02:28 a 02:37, com a trava. H5 a H11 da rodada
>   "antes" (23:05 a 23:13) ficaram fora dessas janelas e foram mantidos.
> - **Servidores de pé na espera:** enquanto esperava a trava, o harness manteve a API, o
>   site e o mongod no ar, parados, durante as medições de outros projetos. O consumo é
>   pequeno (sem tráfego), mas existe.
> - **Trava vazada:** nas rodadas de 14 e 15/10, a trava não foi apagada ao fim da medição,
>   porque o `fs.rmSync` do Node 24 no Windows não apaga caminhos com acento ("portfólio").
>   Isso **não afeta estes números**, porque a trava estava pega durante toda a medição, mas
>   atrasou a fila dos outros projetos. Foi corrigido em `21084dd` (unlink + rmdir, com teste).

![Vazão com 50 VUs](2026-10-04-vazao-50vus.svg)

![Latência p95 com 50 VUs](2026-10-04-p95-50vus.svg)

## Hipóteses: confirmadas e refutadas (50 VUs, salvo indicação)

| Id | Hipótese (resumo) | Medido antes → depois | Veredito |
|---|---|---|---|
| H1 | Controle sem banco: mais de 3.000 req/s, p95 abaixo de 15 ms, sem quebra até 200 VUs | 7.041 → 6.184 req/s; p95 8,5 → 9,5 ms; 0 erros até 200 VUs | **Confirmada.** O helmet, o limitador geral e a checagem do segredo do site custaram cerca de 12% na rota mais barata, que não toca no banco. |
| H2 | Home faz 4 + N consultas; com 30 revistas a vazão cai abaixo de 1/4 da de 1 revista e o p95 passa de 200 ms. Depois: consultas fixas e 2× mais vazão | consultas 5/14/34 (N = 1/10/30) → 3/4/4; 30 revistas: 56 → 255 req/s, p95 953 → 222 ms; com 1 revista 227 → 863 req/s | **Confirmada.** Antes, 56 req/s com 30 revistas contra 227 com 1 (4,05× menos). Depois, o número de consultas ficou fixo e a vazão subiu 4,6×. A resposta encolheu de 188 kB para 52 kB. |
| H3 | Sumário passa de 200 kB; com campos enxutos, menos da metade do tamanho e 2× a vazão | 384 kB → 6,9 kB; 146 → 385 req/s; p95 379 → 145 ms | **Confirmada** (resposta 56× menor, vazão 2,6×). |
| H4 | Vizinhos com o texto inteiro; só com título/slug/autor, 1,5× a vazão | artigo 172 → 726 req/s (p95 317 → 75 ms); texto do ciclo 278 → 678 | **Confirmada com folga** (2,4× a 4,2×). Junta `select` nos vizinhos, `lean` e índice no pai. |
| H5 | Índices em `Film.cycleId` e `Article.parentId` ajudam pouco nesse volume (cerca de 1,3×) | ciclo 191 → 508 req/s; filme 446 → 767 req/s | **Refutada para cima:** 1,7× a 2,7×. Parte vem do índice; parte do `lean`, do `select` e da resposta do ciclo, que caiu de 166 kB para 12 kB. |
| H6 | Senha certa sem limite e acima de 1.000 req/s; senha errada: 10× 401 e depois 429 | certa: 3.271 → 2.985 req/s, 0 respostas 429; errada: 10× 401 e 20× 429 nas duas versões | **Confirmada.** A comparação por hash SHA-256 e o limitador global novo custaram cerca de 9%. |
| H7 | Mesmo título concorrente gera 500 (E11000) e latência crescente; depois, zero 500 | 10 VUs: 99 de 150 criações com 500 → 0; p95 588 → 233 ms; 1 VU: p95 66 → 5,5 ms | **Confirmada.** Antes, 66% das criações concorrentes falhavam. |
| H8 | Reordenar 50 ids: p95 acima de 100 ms; com `bulkWrite`, 2× a vazão | 49 → 451 req/s; p95 1.069 → 308 ms (10 VUs: 51 → 809 req/s) | **Confirmada com folga** (9× a 16×). |
| H9 | Site com `no-store` limitado pela API; home com 30 revistas quebra (p95 acima de 1 s) até 100 VUs | antes: home 52 req/s, p95 1,01 s com 50 VUs (quebra em 50); artigo 127 req/s; a home disparava **65 consultas** por visita | **Confirmada.** Com 50 VUs a home já passava de 1 s. |
| H10 | Com cache e revalidação: 10× a vazão, p95 abaixo de 50 ms, quase nenhuma consulta | consultas por página 65/2/3 → **0/0/0**; vazão: home 52 → 173, /revista 135 → 412, sumário 84 → 122, artigo 127 → 137, ciclo 106 → 127 req/s; p95 da home 1,01 s → 0,32 s | **Parcial.** A parte de banco foi confirmada: zero consultas em regime. A parte de vazão foi **refutada**: 1,1× a 3,3×, não 10×, e p95 de 142 a 457 ms, não 50 ms. Com o banco fora do caminho, o gargalo passou a ser renderizar e enviar HTML de 80 a 190 kB por um único processo `next start`, dividindo a CPU com o k6. Na Vercel, o HTML em cache sai da CDN. |
| H11 | Antes: API fora vira 404 nos detalhes e lista vazia nas listas. Depois: 503 "indisponível" nas sem cache e conteúdo nas em cache | antes: 3 listas com status 200 e "Nenhuma… disponível" e 3 detalhes com **404 falso**; depois: as 6 páginas com status 200 e **conteúdo real do cache** | **Confirmada** na parte que importa: o visitante deixou de receber informação falsa. As páginas da medição estavam todas em cache, então o caminho "sem cache → indisponível" não foi exercitado aqui. Ele é coberto pelo CT-19 e devolve 500, não 503: o Next responde 500 para erro de renderização. |

## Tabelas completas

As tabelas abaixo são geradas por `node carga/relatorio.mjs carga/resultados/antes carga/resultados/depois`. Os JSON brutos ficam fora do Git, em `carga/resultados/`. O `resultados.json` da rodada "antes" já traz H1 a H4 da remedição, com o motivo em `meta.refeitos`.

[Tabelas por degrau, consultas, recursos (CPU e memória) e H6, H7 e H11](tabelas.md)

## Conclusões

1. **O maior ganho estava no número de consultas, não no hardware.**
   - A home deixou de fazer uma consulta por edição (34 → 4).
   - Os sumários deixaram de carregar o corpo dos textos (384 kB → 7 kB).
   - Com isso, as rotas da API ficaram de 1,7× a 16× mais rápidas na mesma máquina.
2. **Correção também é desempenho.** A criação concorrente com o mesmo título falhava em 66% dos casos (H7) e agora não falha.
3. **O cache tirou o banco do caminho do leitor:** zero consultas por página. Também mudou o comportamento com a API fora do ar: antes o visitante via 404 falso e listas vazias, agora vê o conteúdo.
4. **A hipótese mais otimista (H10, 10×) foi refutada.** Num único processo `next start`, o limite passou a ser a renderização e o envio do HTML. Fica registrado como aprendizado: o próximo passo é medir o site atrás de uma CDN, como ele roda em produção.
5. **Segurança tem custo, e ele foi medido:** cerca de 12% na rota de controle (H1) e 9% no login (H6), em troca de cabeçalhos, limites e comparação de senha em tempo constante.
