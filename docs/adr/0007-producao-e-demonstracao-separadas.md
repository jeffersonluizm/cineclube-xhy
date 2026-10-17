# ADR 0007: produção e demonstração separadas

- **Status:** aceita
- **Data:** 17/10/2026

## Contexto

O Cineclube XHY passou a usar o site de verdade: a equipe publica revistas, textos,
catálogos e exibições pelo painel, e o público lê no site e encontra pelos buscadores.
A demonstração de portfólio continua existindo, com o painel aberto a qualquer visitante
e os dados voltando ao exemplo a cada hora (ADR 0004). As duas não podem dividir nada que
uma estrague na outra: banco, senha, imagens, cota de hospedagem.

## Decisão

Duas publicações independentes do mesmo repositório e do mesmo código:

| Peça | Produção (cineclube) | Demonstração (portfólio) |
|---|---|---|
| Site (Vercel) | `https://cineclubexhy.vercel.app`, indexável | `https://cineclube-xhy.vercel.app`, com `NEXT_PUBLIC_DEMO=1` (noindex) |
| API (Render) | `cineclubexhy-api`, Blueprint `render.producao.yaml`, **workspace próprio** | `cineclube-xhy-api`, Blueprint `render.yaml` |
| Banco (Atlas) | projeto `cineclube-xhy-producao`, banco `cineclube_xhy`, usuário só com `readWrite` nele | banco `cineclube_demo` |
| Imagens | Cloudinary, pasta `cineclube-xhy` (persistem) | disco temporário da API, apagado a cada reset |
| Painel | senha da equipe (`ADMIN_PASSWORD`, ADR 0001); `GET /api/demo` responde 404 | "Entrar como editor de demonstração" com um clique |
| `SERVIDOR_SEGREDO` | próprio | outro |

**Por que um workspace separado no Render.** No plano gratuito, as 750 horas de instância
por mês valem **por workspace** e são divididas entre todos os serviços gratuitos dele
(documentação do Render, conferida em 17/10/2026). A API da produção, mantida acordada pelo
despertador, gasta cerca de 744 horas no mês; somada à da demonstração, a cota do workspace
estouraria, e o Render suspende todos os serviços gratuitos do workspace até o mês
seguinte. Com um workspace próprio, a produção tem a sua cota inteira, a demonstração não a
ameaça, e a transferência das contas ao cineclube fica simples.

**Sem código novo para separar.** O modo produção é o padrão: sem `DEMO_ENABLED`, a API
não expõe a demonstração, não apaga nada e exige a senha. O que muda é configuração
(`render.producao.yaml`, variáveis da Vercel) e operação (despertador e backup).

## Consequências

- Duas publicações para manter: cada push na `main` atualiza as duas (Vercel conectada ao
  GitHub; no Render, depois de autorizar o acesso ao repositório).
- O despertador da produção (cron-job.org, com o `keep-alive.yml` como reserva) evita que a
  equipe espere a API acordar; sem ele o site público segue no ar pelo cache da Vercel.
- O banco da produção tem dados reais do cliente: backup com `npm run backup` (pasta local
  fora do Git) e restauração com `npm run restaurar`, que recusa sobrescrever um banco com
  conteúdo sem `--substituir`.
- Um erro de configuração não apaga o conteúdo real: a API recusa `DEMO_ENABLED` num banco
  sem `demo` no nome (ADR 0004), e o Blueprint da produção nem define a variável.
