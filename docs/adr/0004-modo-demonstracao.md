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
  `DEMO_RESET_MINUTOS`** (padrão 60): como não há contas, a proteção contra vandalismo é
  voltar ao estado conhecido.
- Volume contido na demonstração: teto por coleção (50 revistas, 300 textos, 50 catálogos,
  50 exibições, 300 filmes; variáveis `DEMO_TETO_*`) com 409 em português, corpo JSON de até
  256 kB e até 60 escritas por hora por IP (`DEMO_ESCRITAS_POR_HORA`).
- Conteúdo externo contido na demonstração: imagem só de upload do próprio painel ou capa
  de exemplo (endereço https externo responde 400), para ninguém pôr na home uma imagem
  hospedada em qualquer lugar; links da equipe saem com `rel="noopener noreferrer nofollow"`.
- Upload contido na demonstração: até 2 MB, 10 imagens por hora por IP, sempre em disco
  na pasta `uploads/demo` (nunca no Cloudinary), apagada a cada reset.
- A API se recusa a partir com a flag se o nome do banco não tiver `demo`. Única exceção:
  o banco local do `iniciar.bat`, fora de produção e com o reset desligado.
- O site da demonstração sai dos buscadores com `NEXT_PUBLIC_DEMO=1` (`noindex` e
  `robots.txt` bloqueando tudo).

## Consequências

- O avaliador entra com um clique em "Entrar no painel como editor de demonstração".
- Qualquer pessoa na demonstração pode editar e excluir; o reset limita o dano a uma hora.
  O prazo conta a partir do último reset gravado no banco (`demo_meta`), conferido na
  partida e a cada 5 minutos: não depende de a API ficar no ar (o Render gratuito dorme
  depois de 15 min).
- Imagem enviada que sumiu do disco efêmero (o Render apaga o disco ao dormir) **não**
  dispara o reset completo: só a referência sai (capa e imagem do filme ficam vazias e o site
  mostra a capa padrão; o bloco de imagem quebrado é retirado). Assim ninguém consegue apagar
  o trabalho dos outros de propósito. O painel também recusa salvar um `/uploads/demo/<nome>`
  que não existe, e a conferência só olha os campos de imagem (texto corrido não conta).
- O reset roda numa transação quando o banco é replica set (Atlas M0): uma falha no meio
  não deixa o banco pela metade. As imagens enviadas são apagadas mesmo se o seed falhar,
  e o site é avisado para invalidar o cache.
- Ligar a flag num banco com conteúdo real apagaria esse conteúdo: além do aviso no
  `docs/deploy.md`, no `render.yaml` e nesta decisão, a API recusa um banco sem `demo` no nome.
