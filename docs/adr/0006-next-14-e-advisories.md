# ADR 0006: ficar no Next 14.2 (última) e fechar a superfície dos advisories

- **Status:** substituída em 17/10/2026: o site foi migrado para o Next 16.4.2 (React 19), que
  corrige os advisories abaixo; as medidas de configuração (otimizador de imagens desligado,
  404 em `/_next/image`, agora no `proxy.ts`) continuam valendo. Antes: aceita (1.3.0)
- **Data:** 04/10/2026

## Contexto

A revisão de segurança pediu subir o Next 14.2.3 para a última 14.2.x. Feito: **14.2.35**.
O `npm audit` ainda lista advisories cuja correção só existe no Next 15.5.x/16, entre eles
dois críticos: execução remota de código no otimizador de imagens (com AVIF) e em
servidores hospedados no Windows. A migração para o 15/16 muda `params`/`searchParams`
para assíncronos, exige React 19 e muda padrões de cache: é um projeto à parte.

## Decisão

Ficar no 14.2.35 nesta versão e fechar a superfície de cada advisory que se aplica:

| Advisory | Situação neste projeto |
|---|---|
| Otimizador de imagens (RCE com AVIF, DoS, cache em disco) | `images.unoptimized: true`, nenhum `next/image` no código e o `middleware.ts` responde 404 em `/_next/image` |
| RCE em servidor hospedado no Windows | produção na Vercel (Linux); em desenvolvimento o `next dev` só escuta em `127.0.0.1` |
| Server Actions (DoS, SSRF, payload) | o projeto não usa Server Actions |
| Rewrites (SSRF, smuggling) | o projeto não usa rewrites |
| WebSocket upgrades (SSRF) | não usa WebSocket |
| CSP com nonce / `beforeInteractive` (XSS) | não usa nonce nem `beforeInteractive` |
| Pages Router com i18n (bypass de middleware) | só App Router, sem i18n |
| Cache poisoning em respostas RSC e redirecionamentos de middleware | risco residual baixo: as páginas são públicas e iguais para todos; o painel não é cacheado |
| DoS em React Server Components / App Router ([GHSA-h25m-26qc-wcjf](https://github.com/advisories/GHSA-h25m-26qc-wcjf), [GHSA-q4gf-8mx6-v5v3](https://github.com/advisories/GHSA-q4gf-8mx6-v5v3), [GHSA-8h8q-6873-q5fj](https://github.com/advisories/GHSA-8h8q-6873-q5fj)) | **risco residual, sem fechamento por configuração**: toda página usa App Router e RSC. Mitigação parcial: na Vercel as páginas em cache saem da CDN sem chegar à função, a plataforma tem proteção de DoS na borda e o `middleware.ts` limita requisições por IP. Uma requisição forjada que chegue à função ainda pode consumir CPU até o tempo máximo da função |

Na API (Express 4), o `qs` vulnerável deixou de ser usado: `app.set('query parser', 'simple')`
e os filtros validam com `z.strictObject`.

## Consequências

- O site segue no ar sem a migração, com os vetores conhecidos fechados por configuração.
- O `npm audit` continua listando os advisories (a dependência existe, o caminho não).
- Os três advisories de DoS em RSC/App Router ficam como **risco residual aceito** até a
  migração: o pior caso é indisponibilidade temporária do site público, sem vazamento de
  dados nem execução de código.
- Próximo passo registrado no README: migrar para Next 15.5+ / React 19.
