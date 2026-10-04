# ADR 0004: modo demonstração por flag de servidor

- **Status:** aceita (1.3.0)
- **Data:** 04/10/2026

## Contexto

O projeto é avaliado por quem abre o link da demonstração hospedada: precisa entrar no
painel com um clique, sem receber senha por fora. Ao mesmo tempo, nenhuma credencial de
demonstração pode estar no código, e o site oficial não pode ter essa porta aberta.

## Decisão

- Flag `DEMO_ENABLED`, **desligada por padrão**. Só o ambiente hospedado da demonstração
  (com banco exclusivo de exemplo) a liga.
- `GET /api/demo` é a fonte única para o site: com a flag, descreve o papel de
  demonstração (sem senha nenhuma); sem a flag, responde 404 e o site não mostra nada.
- `POST /api/demo/entrar` emite um token de editor com um clique, só com a flag.
- A senha real do painel (`ADMIN_PASSWORD`) continua existindo e nunca é exposta.
- A API popula o banco vazio na primeira partida e **restaura os dados de exemplo a cada
  `DEMO_RESET_MINUTOS`** (padrão 360): como não há contas, a proteção contra vandalismo é
  voltar ao estado conhecido.

## Consequências

- O avaliador entra com um clique em "Entrar no painel como editor de demonstração".
- Qualquer pessoa na demonstração pode editar e excluir; o reset limita o dano a algumas horas.
- Ligar a flag num banco com conteúdo real apagaria esse conteúdo: o `docs/deploy.md`,
  o `render.yaml` e esta decisão repetem o aviso.
