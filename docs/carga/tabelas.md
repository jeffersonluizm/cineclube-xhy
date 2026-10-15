### Vazão e latência por degrau de VUs

| Cenário | VUs | req/s antes | req/s depois | p50 antes | p50 depois | p95 antes | p95 depois | p99 antes | p99 depois | erros antes | erros depois |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| H1 health (sem banco) | 10 | 7.130 | 6.182 | 1,1 | 1,6 | 2 | 2,3 | 2,5 | 2,6 | 0% | 0% |
| H1 health (sem banco) | 50 | 7.041 | 6.184 | 7,1 | 8,1 | 8,5 | 9,5 | 9,1 | 10,2 | 0% | 0% |
| H1 health (sem banco) | 100 | 6.763 | 6.016 | 15,1 | 16,8 | 17 | 18,6 | 17,6 | 19,5 | 0% | 0% |
| H1 health (sem banco) | 200 | 6.810 | 6.001 | 30,4 | 34,2 | 33,1 | 37,4 | 35 | 38,8 | 0% | 0% |
| H2 home, 1 revista | 10 | 234 | 928 | 41,9 | 10,4 | 49,8 | 13,9 | 54,2 | 16 | 0% | 0% |
| H2 home, 1 revista | 50 | 227 | 863 | 217,8 | 57 | 238,7 | 65,5 | 243,5 | 73,7 | 0% | 0% |
| H2 home, 1 revista | 100 | 223 | 846 | 442,2 | 116,9 | 487,7 | 127,5 | 538,6 | 147,1 | 0% | 0% |
| H2 home, 1 revista | 200 | 220 | 835 | 909,5 | 237,4 | 990,7 | 258,4 | 1.039,5 | 281,4 | 0% | 0% |
| H2 home, 10 revistas | 10 | 131 | 472 | 74,3 | 20,7 | 91,1 | 24,6 | 98,4 | 27,8 | 0% | 0% |
| H2 home, 10 revistas | 50 | 116 | 472 | 430,3 | 105,3 | 461,6 | 115,7 | 473 | 121,9 | 0% | 0% |
| H2 home, 10 revistas | 100 | 113 | 453 | 881,4 | 220,8 | 932,6 | 243,1 | 981,8 | 253,7 | 0% | 0% |
| H2 home, 10 revistas | 200 | 113 | 423 | 1.770,4 | 474,8 | 1.832,6 | 517,8 | 2.001,9 | 538 | 0% | 0% |
| H2 home, 30 revistas | 10 | 60 | 267 | 165,2 | 36,9 | 175,7 | 44,8 | 182 | 49,9 | 0% | 0% |
| H2 home, 30 revistas | 50 | 56 | 255 | 894,3 | 193,8 | 953,3 | 222 | 982,6 | 251,1 | 0% | 0% |
| H2 home, 30 revistas | 100 | 56 | 237 | 1.779,9 | 419,6 | 1.864,4 | 463,4 | 1.960,4 | 484,9 | 0% | 0% |
| H2 home, 30 revistas | 200 | 55 | 231 | 3.612,4 | 862,4 | 3.804 | 922 | 3.923,5 | 1.084,7 | 0% | 0% |
| H3 sumário da revista | 10 | 148 | 384 | 65,7 | 25,4 | 82,4 | 31,2 | 90,4 | 34,2 | 0% | 0% |
| H3 sumário da revista | 50 | 146 | 385 | 337,1 | 128,1 | 378,5 | 144,5 | 402,6 | 155,9 | 0% | 0% |
| H3 sumário da revista | 100 | 134 | 392 | 725,2 | 252,1 | 884 | 270,2 | 907,9 | 316,6 | 0% | 0% |
| H3 sumário da revista | 200 | 138 | 381 | 1.427,7 | 520,1 | 1.923,3 | 711,8 | 2.049,8 | 752,4 | 0% | 0% |
| H4 artigo (vizinhos) | 10 | 174 | 731 | 56,3 | 13,3 | 67,5 | 16 | 74,3 | 17,6 | 0% | 0% |
| H4 artigo (vizinhos) | 50 | 172 | 726 | 289,3 | 68,4 | 316,5 | 75,3 | 338,5 | 81,9 | 0% | 0% |
| H4 artigo (vizinhos) | 100 | 166 | 725 | 598,1 | 136,5 | 649,5 | 152,1 | 694,4 | 162,8 | 0% | 0% |
| H4 artigo (vizinhos) | 200 | 161 | 703 | 1.233,4 | 285,4 | 1.386,1 | 319,2 | 1.446,7 | 339,7 | 0% | 0% |
| H4 texto do ciclo | 10 | 277 | 674 | 35,2 | 14,5 | 41,8 | 16,9 | 45,8 | 18,7 | 0% | 0% |
| H4 texto do ciclo | 50 | 278 | 678 | 178,1 | 73,3 | 195,2 | 78,6 | 201,7 | 83,5 | 0% | 0% |
| H4 texto do ciclo | 100 | 266 | 659 | 373,7 | 149,9 | 398,2 | 169,1 | 406,1 | 175,9 | 0% | 0% |
| H4 texto do ciclo | 200 | 257 | 657 | 767,3 | 304,7 | 862,3 | 343,7 | 937,8 | 378,4 | 0% | 0% |
| H5 ciclo | 10 | 200 | 508 | 49,2 | 19,4 | 58,3 | 22,8 | 66 | 25,1 | 0% | 0% |
| H5 ciclo | 50 | 191 | 508 | 258,8 | 97,5 | 289,7 | 107 | 305,4 | 112,6 | 0% | 0% |
| H5 ciclo | 100 | 191 | 479 | 516 | 212 | 564,3 | 235,3 | 619,2 | 243,5 | 0% | 0% |
| H5 ciclo | 200 | 182 | 447 | 1.074,7 | 434 | 1.337 | 524,5 | 1.483,3 | 564,6 | 0% | 0% |
| H5 filme | 10 | 447 | 761 | 21,9 | 12,8 | 25,7 | 15,4 | 30,5 | 17 | 0% | 0% |
| H5 filme | 50 | 446 | 767 | 110,9 | 64,9 | 123,9 | 71,3 | 133,5 | 75,1 | 0% | 0% |
| H5 filme | 100 | 441 | 775 | 224,8 | 127,9 | 242,3 | 140,2 | 251,8 | 150,2 | 0% | 0% |
| H5 filme | 200 | 414 | 741 | 481,4 | 271,7 | 535,7 | 299 | 561,3 | 316,8 | 0% | 0% |
| H8 reordenar 50 textos | 10 | 51 | 809 | 194,9 | 12,2 | 208,3 | 15,1 | 221,7 | 16,4 | 0% | 0% |
| H8 reordenar 50 textos | 50 | 49 | 451 | 1.017,2 | 62,6 | 1.068,9 | 307,6 | 1.095,5 | 347,2 | 0% | 0% |
| H9/H10 site: home | 10 | 52 | 169 | 189,8 | 57,3 | 211,5 | 75,2 | 223,6 | 83,7 | 0% | 0% |
| H9/H10 site: home | 50 | 52 | 173 | 960,6 | 284,6 | 1.014,2 | 323,7 | 1.042,5 | 347,5 | 0% | 0% |
| H9/H10 site: home | 100 | 51 | 175 | 1.931,9 | 547,1 | 2.029,7 | 653,1 | 2.115,3 | 1.209,2 | 0% | 0% |
| H9/H10 site: /revista | 10 | 132 | 414 | 75 | 22,9 | 85,3 | 32,1 | 93,2 | 37,8 | 0% | 0% |
| H9/H10 site: /revista | 50 | 135 | 412 | 366,8 | 118,3 | 406,1 | 142 | 414,7 | 161,3 | 0% | 0% |
| H9/H10 site: /revista | 100 | 138 | 403 | 712,7 | 244,7 | 770,1 | 289,8 | 797 | 302,6 | 0% | 0% |
| H9/H10 site: sumário | 10 | 84 | 121 | 118,9 | 81,5 | 140,9 | 95,4 | 149,4 | 101,3 | 0% | 0% |
| H9/H10 site: sumário | 50 | 84 | 122 | 604,3 | 405 | 671 | 456,8 | 769,5 | 471,1 | 0% | 0% |
| H9/H10 site: sumário | 100 | 83 | 126 | 1.226,6 | 790,6 | 1.337,4 | 856,7 | 1.613,1 | 880,4 | 0% | 0% |
| H9/H10 site: artigo | 10 | 130 | 133 | 76,2 | 73,3 | 87,5 | 90,1 | 95,7 | 101,3 | 0% | 0% |
| H9/H10 site: artigo | 50 | 127 | 137 | 391,1 | 359,4 | 418 | 401,7 | 434,8 | 415,2 | 0% | 0% |
| H9/H10 site: artigo | 100 | 125 | 138 | 792,7 | 717,4 | 828,1 | 796,4 | 914,5 | 848,1 | 0% | 0% |
| H9/H10 site: ciclo | 10 | 103 | 119 | 96,2 | 82,2 | 112,2 | 99,5 | 124,4 | 106,2 | 0% | 0% |
| H9/H10 site: ciclo | 50 | 106 | 127 | 476,1 | 390,1 | 526,8 | 424,3 | 641 | 438,3 | 0% | 0% |
| H9/H10 site: ciclo | 100 | 103 | 124 | 985,1 | 788,7 | 1.057,4 | 903,2 | 1.085,3 | 921,2 | 0% | 0% |

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
| siteHome | 65 | 0 | 182.358 | 189.669 |
| siteRevista | 2 | 0 | 67.877 | 82.430 |
| siteArtigo | 3 | 0 | 73.213 | 84.792 |
| home-1 | 5 | 3 | 139.360 | 3.240 |
| home-10 | 14 | 4 | 154.461 | 18.341 |
| home-30 | 34 | 4 | 188.249 | 52.129 |

Consultas = variação de `opcounters.query + getmore` do MongoDB durante uma requisição já aquecida (no site, inclui `generateMetadata` e a página).

### Recursos no degrau de 50 VUs (CPU em % da máquina inteira, memória em MB de pico)

| Cenário | API antes | API depois | site antes | site depois | mongod antes | mongod depois |
|---|---|---|---|---|---|---|
| H1 health (sem banco) | 8,2% / 108 MB | 7,8% / 117 MB | 0% / 99 MB | 0% / 119 MB | 0,2% / 99 MB | 0,2% / 95 MB |
| H2 home, 1 revista | 8,8% / 339 MB | 8,5% / 342 MB | 0% / 99 MB | 0% / 119 MB | 5,4% / 110 MB | 9,1% / 121 MB |
| H2 home, 10 revistas | 9% / 457 MB | 8,7% / 416 MB | 0% / 99 MB | 0% / 119 MB | 10,3% / 116 MB | 8,3% / 149 MB |
| H2 home, 30 revistas | 9,3% / 509 MB | 10,9% / 484 MB | 0% / 99 MB | 0% / 119 MB | 15% / 134 MB | 8,8% / 177 MB |
| H3 sumário da revista | 9% / 642 MB | 8,3% / 554 MB | 0% / 99 MB | 0% / 119 MB | 2,3% / 142 MB | 3,3% / 197 MB |
| H4 artigo (vizinhos) | 9,1% / 649 MB | 8,2% / 548 MB | 0% / 98 MB | 0% / 119 MB | 2,6% / 132 MB | 6,5% / 198 MB |
| H4 texto do ciclo | 8,9% / 647 MB | 8% / 543 MB | 0% / 98 MB | 0% / 119 MB | 3,5% / 132 MB | 5,8% / 198 MB |
| H5 ciclo | 8,6% / 630 MB | 9% / 548 MB | 0% / 94 MB | 0% / 118 MB | 3,3% / 117 MB | 5% / 191 MB |
| H5 filme | 7,8% / 587 MB | 8% / 522 MB | 0% / 94 MB | 0% / 118 MB | 4,8% / 117 MB | 5,1% / 192 MB |
| H8 reordenar 50 textos | 9,4% / 607 MB | 4,4% / 532 MB | 0% / 94 MB | 0% / 118 MB | 4,6% / 125 MB | 16,7% / 206 MB |
| H9/H10 site: home | 8,9% / 594 MB | 0% / 533 MB | 9,1% / 467 MB | 8,5% / 315 MB | 17,6% / 129 MB | 0,1% / 206 MB |
| H9/H10 site: /revista | 1,6% / 592 MB | 0% / 172 MB | 9,5% / 544 MB | 8,3% / 311 MB | 0,5% / 129 MB | 0,2% / 206 MB |
| H9/H10 site: sumário | 6,5% / 628 MB | 0,3% / 183 MB | 9,1% / 568 MB | 9,6% / 538 MB | 1,5% / 130 MB | 0,2% / 206 MB |
| H9/H10 site: artigo | 9,4% / 629 MB | 0,4% / 133 MB | 8,8% / 531 MB | 9,2% / 573 MB | 2,9% / 129 MB | 0,1% / 206 MB |
| H9/H10 site: ciclo | 5,5% / 624 MB | 0,3% / 139 MB | 8,9% / 582 MB | 9,9% / 612 MB | 2,3% / 129 MB | 0,2% / 206 MB |

### H6: login

| Caso | 2xx antes | 4xx antes | 429 antes | req/s antes | 2xx depois | 4xx depois | 429 depois | req/s depois |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| senha certa | 49117 | 0 | 0 | 3.271 | 44830 | 0 | 0 | 2.985 |
| senha errada (30 tentativas seguidas) | 0 | 10 | 20 | 1.058 | 0 | 10 | 20 | 934 |

### H7: 150 criações com o mesmo título

| VUs | 2xx antes | 5xx antes | p95 antes | 2xx depois | 5xx depois | p95 depois |
|---:|---:|---:|---:|---:|---:|---:|
| 1 | 150 | 0 | 66,1 | 150 | 0 | 5,5 |
| 10 | 51 | 99 | 588,4 | 150 | 0 | 233 |

### H11: site com a API fora do ar

| Página | status antes | mostra antes | status depois | mostra depois |
|---|---:|---|---:|---|
| `/` | 200 | lista vazia ("Nenhuma… disponível" / "Em breve") | 200 | conteúdo (do cache) |
| `/revista` | 200 | lista vazia ("Nenhuma… disponível" / "Em breve") | 200 | conteúdo (do cache) |
| `/catalogos` | 200 | lista vazia ("Nenhuma… disponível" / "Em breve") | 200 | conteúdo (do cache) |
| `/revista/30` | 404 | página 404 ("fim da sessão") | 200 | conteúdo (do cache) |
| `/revista/30/artigo/texto-8-da-revista-30` | 404 | página 404 ("fim da sessão") | 200 | conteúdo (do cache) |
| `/ciclos-mostras/ciclo-de-carga-1` | 404 | página 404 ("fim da sessão") | 200 | conteúdo (do cache) |
