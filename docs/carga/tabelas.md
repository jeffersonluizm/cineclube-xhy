### Vazão e latência por degrau de VUs

| Cenário | VUs | req/s antes | req/s depois | p50 antes | p50 depois | p95 antes | p95 depois | p99 antes | p99 depois | erros antes | erros depois |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| H1 health (sem banco) | 10 | 5.623 | 5.784 | 1,6 | 1,6 | 2,8 | 2,5 | 3,8 | 4 | 0% | 0% |
| H1 health (sem banco) | 50 | 4.475 | 7.067 | 9,5 | 6,1 | 16,7 | 11 | 29,6 | 16,3 | 0% | 0% |
| H1 health (sem banco) | 100 | 4.956 | 6.646 | 19,3 | 14,6 | 26,4 | 19,4 | 33,2 | 21,8 | 0% | 0% |
| H1 health (sem banco) | 200 | 4.882 | 6.464 | 38,8 | 30,7 | 53,5 | 38,5 | 68 | 43,6 | 0% | 0% |
| H2 home, 1 revista | 10 | 140 | 1.086 | 66,4 | 9,1 | 101,9 | 12,4 | 128,5 | 14,8 | 0% | 0% |
| H2 home, 1 revista | 50 | 151 | 736 | 323,1 | 62,7 | 380,2 | 98,2 | 412,6 | 148,2 | 0% | 0% |
| H2 home, 1 revista | 100 | 139 | 577 | 675,1 | 127,9 | 978,3 | 208,4 | 1.081,4 | 3.333,9 | 0% | 0% |
| H2 home, 1 revista | 200 | 160 | 585 | 1.219,9 | 316,3 | 1.487,6 | 429,8 | 1.557,4 | 587,3 | 0% | 0% |
| H2 home, 10 revistas | 10 | 90 | 231 | 103,3 | 36,5 | 153,9 | 84,5 | 171,1 | 143,9 | 0% | 0% |
| H2 home, 10 revistas | 50 | 80 | 273 | 590 | 175,5 | 797,9 | 232,8 | 928,6 | 257,4 | 0% | 0% |
| H2 home, 10 revistas | 100 | 90 | 466 | 1.093,3 | 208,4 | 1.229,6 | 267,7 | 1.260,6 | 290 | 0% | 0% |
| H2 home, 10 revistas | 200 | 77 | 422 | 2.284,6 | 471,3 | 3.918,7 | 649,4 | 4.461,8 | 770,5 | 0% | 0% |
| H2 home, 30 revistas | 10 | 43 | 82 | 216,2 | 91,7 | 310,7 | 295,1 | 498,4 | 663,3 | 0% | 0% |
| H2 home, 30 revistas | 50 | 43 | 87 | 1.163,2 | 550,8 | 1.317,9 | 808,5 | 1.414,3 | 870,6 | 0% | 0% |
| H2 home, 30 revistas | 100 | 38 | 123 | 2.559,9 | 732 | 3.103,5 | 1.003,6 | 3.163,5 | 1.146,1 | 0% | 0% |
| H2 home, 30 revistas | 200 | 41 | 198 | 4.449,9 | 842,1 | 5.767,5 | 1.780,8 | 6.335,1 | 1.939,4 | 0% | 0% |
| H3 sumário da revista | 10 | 100 | 254 | 96,2 | 39,3 | 140,8 | 46,9 | 171,1 | 53,4 | 0% | 0% |
| H3 sumário da revista | 50 | 105 | 257 | 473,8 | 191,7 | 495,9 | 208,8 | 502,6 | 250,2 | 0% | 0% |
| H3 sumário da revista | 100 | 96 | 421 | 987,4 | 226,2 | 1.381,9 | 322,6 | 1.531,1 | 369,3 | 0% | 0% |
| H3 sumário da revista | 200 | 97 | 354 | 2.015,6 | 549,5 | 2.843 | 831,7 | 3.010,4 | 963,8 | 0% | 0% |
| H4 artigo (vizinhos) | 10 | 106 | 740 | 82,5 | 13,3 | 150 | 15,6 | 294,7 | 16,9 | 0% | 0% |
| H4 artigo (vizinhos) | 50 | 118 | 692 | 420,2 | 70,8 | 477,3 | 82,1 | 554,9 | 104,7 | 0% | 0% |
| H4 artigo (vizinhos) | 100 | 110 | 531 | 897,1 | 149,1 | 1.062,7 | 222,7 | 1.187,9 | 2.878,3 | 0% | 0% |
| H4 artigo (vizinhos) | 200 | 111 | 652 | 1.764,3 | 290,9 | 2.110,4 | 348 | 2.251,3 | 1.073 | 0% | 0% |
| H4 texto do ciclo | 10 | 203 | 646 | 47,4 | 14,7 | 61,4 | 17,3 | 70,5 | 19,9 | 0% | 0% |
| H4 texto do ciclo | 50 | 189 | 684 | 242,9 | 72,5 | 376 | 79,7 | 598,3 | 84,1 | 0% | 0% |
| H4 texto do ciclo | 100 | 198 | 581 | 483,6 | 151,8 | 635 | 173,8 | 693 | 1.697,6 | 0% | 0% |
| H4 texto do ciclo | 200 | 195 | 620 | 1.009,3 | 312 | 1.254 | 430,6 | 1.340,2 | 497 | 0% | 0% |
| H5 ciclo | 10 | 138 | 376 | 66,6 | 25,4 | 102,2 | 37,2 | 160,1 | 51,1 | 0% | 0% |
| H5 ciclo | 50 | 135 | 439 | 343,1 | 109,4 | 485,1 | 143,4 | 579,5 | 164,3 | 0% | 0% |
| H5 ciclo | 100 | 137 | 432 | 720,7 | 233,3 | 830 | 275,5 | 946,4 | 298,2 | 0% | 0% |
| H5 ciclo | 200 | 128 | 429 | 1.439,2 | 452,8 | 2.218,4 | 545,6 | 2.612,5 | 616,2 | 0% | 0% |
| H5 filme | 10 | 274 | 688 | 34,4 | 14 | 51,4 | 17,8 | 65,4 | 20,6 | 0% | 0% |
| H5 filme | 50 | 285 | 693 | 170,2 | 70,4 | 218,4 | 84,7 | 286,2 | 100,8 | 0% | 0% |
| H5 filme | 100 | 304 | 715 | 304,5 | 136,1 | 445,6 | 164,4 | 497,8 | 180,9 | 0% | 0% |
| H5 filme | 200 | 246 | 705 | 774,3 | 283,1 | 1.065,4 | 330,3 | 1.557,7 | 364,2 | 0% | 0% |
| H8 reordenar 50 textos | 10 | 23 | 524 | 245,7 | 15,1 | 477,1 | 24,5 | 6.239,8 | 46,3 | 0% | 0% |
| H8 reordenar 50 textos | 50 | 33 | 474 | 1.305,9 | 99,3 | 3.049,7 | 146,4 | 3.157,8 | 235,3 | 0% | 0% |
| H9/H10 site: home | 10 | 33 | 144 | 270,3 | 61,9 | 507,9 | 114,5 | 650,6 | 139,7 | 0% | 0% |
| H9/H10 site: home | 50 | 40 | 94 | 1.216,9 | 506,9 | 1.443,6 | 681,9 | 1.651,1 | 720,6 | 0% | 0% |
| H9/H10 site: home | 100 | 37 | 129 | 2.564,3 | 707,6 | 3.089,1 | 1.011,7 | 3.238,1 | 1.095,8 | 0% | 0% |
| H9/H10 site: /revista | 10 | 93 | 371 | 105,1 | 25,5 | 133 | 37,6 | 143,1 | 47,7 | 0% | 0% |
| H9/H10 site: /revista | 50 | 87 | 333 | 517,6 | 141,9 | 891 | 219,5 | 945,6 | 251 | 0% | 0% |
| H9/H10 site: /revista | 100 | 84 | 357 | 1.167,2 | 269,5 | 1.627,1 | 356,2 | 1.679,4 | 475,4 | 0% | 0% |
| H9/H10 site: sumário | 10 | 65 | 123 | 151,2 | 74,8 | 192,4 | 114,6 | 215 | 154,8 | 0% | 0% |
| H9/H10 site: sumário | 50 | 66 | 116 | 714,4 | 386,9 | 1.030,2 | 600,5 | 1.471,2 | 750,4 | 0% | 0% |
| H9/H10 site: sumário | 100 | 74 | 126 | 1.373,3 | 778,9 | 1.509,9 | 963 | 1.719,7 | 1.054 | 0% | 0% |
| H9/H10 site: artigo | 10 | 112 | 79 | 87,6 | 116,6 | 106,4 | 203,1 | 119,5 | 479 | 0% | 0% |
| H9/H10 site: artigo | 50 | 97 | 127 | 484,3 | 398,6 | 733,2 | 494,3 | 850,9 | 506,1 | 0% | 0% |
| H9/H10 site: artigo | 100 | 102 | 161 | 940,4 | 601,3 | 1.144,5 | 822,3 | 1.306 | 891,6 | 0% | 0% |
| H9/H10 site: ciclo | 10 | 62 | 134 | 144 | 70,2 | 252,6 | 102,1 | 366 | 133,7 | 0% | 0% |
| H9/H10 site: ciclo | 50 | 74 | 118 | 660,9 | 403,5 | 835 | 539,6 | 1.187,7 | 678,6 | 0% | 0% |
| H9/H10 site: ciclo | 100 | 73 | 124 | 1.275,1 | 805,7 | 2.265,2 | 1.048,7 | 2.458,1 | 1.349 | 0% | 0% |

Latências em milissegundos. "erros" = respostas com status 4xx/5xx ou sem resposta.

### Consultas ao banco por requisição e tamanho da resposta

| Requisição | consultas antes | consultas depois | bytes antes | bytes depois |
|---|---:|---:|---:|---:|
| home | 34 | 4 | 188.249 | 52.129 |
| revista | 2 | 2 | 384.031 | 6.857 |
| artigo | 3 | 3 | 28.389 | 28.389 |
| ciclo | 3 | 3 | 166.410 | 11.840 |
| filme | 3 | 3 | 7.151 | 6.326 |
| textoCiclo | 3 | 3 | 33.562 | 32.737 |
| siteHome | 65 | 0 | 182.358 | 179.275 |
| siteRevista | 2 | 0 | 67.877 | 81.637 |
| siteArtigo | 3 | 0 | 73.213 | 84.593 |
| home-1 | 5 | 3 | 139.360 | 3.240 |
| home-10 | 14 | 4 | 154.461 | 18.341 |
| home-30 | 34 | 4 | 188.249 | 52.129 |

Consultas = variação de `opcounters.query + getmore` do MongoDB durante uma requisição já aquecida (no site, inclui `generateMetadata` e a página).

### Recursos no degrau de 50 VUs (CPU em % da máquina inteira, memória em MB de pico)

| Cenário | API antes | API depois | site antes | site depois | mongod antes | mongod depois |
|---|---|---|---|---|---|---|
| H1 health (sem banco) | 6% / 110 MB | 7,4% / 116 MB | 0% / 108 MB | 0% / 130 MB | 0,1% / 179 MB | 0% / 177 MB |
| H2 home, 1 revista | 7,9% / 332 MB | 7,5% / 343 MB | 0% / 108 MB | 0% / 130 MB | 4,5% / 190 MB | 7,8% / 204 MB |
| H2 home, 10 revistas | 7,6% / 469 MB | 4,3% / 379 MB | 0% / 108 MB | 0,1% / 130 MB | 7,4% / 197 MB | 4,3% / 243 MB |
| H2 home, 30 revistas | 8,1% / 481 MB | 3% / 463 MB | 0% / 108 MB | 0% / 130 MB | 12,5% / 215 MB | 2,5% / 264 MB |
| H3 sumário da revista | 8,7% / 681 MB | 4,1% / 515 MB | 0% / 108 MB | 0% / 130 MB | 1,6% / 223 MB | 1,7% / 294 MB |
| H4 artigo (vizinhos) | 8,6% / 678 MB | 8% / 493 MB | 0% / 108 MB | 0% / 130 MB | 2,4% / 223 MB | 6,2% / 295 MB |
| H4 texto do ciclo | 7,8% / 679 MB | 7,1% / 491 MB | 0% / 108 MB | 0% / 130 MB | 3,1% / 223 MB | 4,9% / 295 MB |
| H5 ciclo | 7,8% / 680 MB | 7,5% / 507 MB | 0% / 108 MB | 0% / 130 MB | 3% / 222 MB | 4,1% / 297 MB |
| H5 filme | 7,7% / 647 MB | 8,2% / 477 MB | 0% / 108 MB | 0% / 129 MB | 4% / 134 MB | 5,1% / 297 MB |
| H8 reordenar 50 textos | 7,2% / 658 MB | 5,7% / 492 MB | 0% / 108 MB | 0% / 130 MB | 3,7% / 145 MB | 15,2% / 308 MB |
| H9/H10 site: home | 7,9% / 648 MB | 0% / 493 MB | 7,9% / 486 MB | 6,3% / 323 MB | 13,7% / 149 MB | 0,1% / 308 MB |
| H9/H10 site: /revista | 1,4% / 622 MB | 0% / 168 MB | 8,6% / 507 MB | 8% / 334 MB | 0,4% / 146 MB | 0,2% / 308 MB |
| H9/H10 site: sumário | 6,3% / 681 MB | 0,1% / 177 MB | 8,8% / 547 MB | 9% / 516 MB | 1,3% / 147 MB | 0,1% / 308 MB |
| H9/H10 site: artigo | 8% / 677 MB | 0% / 136 MB | 8,1% / 505 MB | 8,7% / 595 MB | 2,5% / 147 MB | 0,1% / 308 MB |
| H9/H10 site: ciclo | 4,7% / 682 MB | 0% / 137 MB | 8,3% / 562 MB | 7,8% / 532 MB | 2,1% / 147 MB | 0,1% / 308 MB |

### H6: login

| Caso | 2xx antes | 4xx antes | 429 antes | req/s antes | 2xx depois | 4xx depois | 429 depois | req/s depois |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| senha certa | 38119 | 0 | 0 | 2.538 | 34647 | 0 | 0 | 2.307 |
| senha errada (30 tentativas seguidas) | 0 | 10 | 20 | 618 | 0 | 10 | 20 | 765 |

### H7: 150 criações com o mesmo título

| VUs | 2xx antes | 5xx antes | p95 antes | 2xx depois | 5xx depois | p95 depois |
|---:|---:|---:|---:|---:|---:|---:|
| 1 | 150 | 0 | 88,8 | 150 | 0 | 6,7 |
| 10 | 59 | 91 | 737,2 | 150 | 0 | 286,2 |

### H11: site com a API fora do ar

| Página | status antes | mostra antes | status depois | mostra depois |
|---|---:|---|---:|---|
| `/` | 200 | lista vazia ("Nenhuma… disponível" / "Em breve") | 200 | conteúdo (do cache) |
| `/revista` | 200 | lista vazia ("Nenhuma… disponível" / "Em breve") | 200 | conteúdo (do cache) |
| `/catalogos` | 200 | lista vazia ("Nenhuma… disponível" / "Em breve") | 200 | conteúdo (do cache) |
| `/revista/30` | 404 | página 404 ("fim da sessão") | 200 | conteúdo (do cache) |
| `/revista/30/artigo/texto-8-da-revista-30` | 404 | página 404 ("fim da sessão") | 200 | conteúdo (do cache) |
| `/ciclos-mostras/ciclo-de-carga-1` | 404 | página 404 ("fim da sessão") | 200 | conteúdo (do cache) |
