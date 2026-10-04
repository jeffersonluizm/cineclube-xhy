# ADR 0003: MongoDB embutido em desenvolvimento e em memória nos testes

- **Status:** aceita (1.1.0), revista em 1.2.0 e 1.3.0
- **Data:** 04/10/2026

## Contexto

Quem quiser rodar o projeto (a equipe, um avaliador) não deveria instalar MongoDB nem
Docker. Os testes não podem depender de um banco externo nem tocar em dados de verdade.

## Decisão

- **Desenvolvimento:** se `MONGODB_URI` (ou `localhost:27017`) não responder, a API sobe
  um MongoDB embutido (`mongodb-memory-server`) com dados persistidos em `backend/data/db`,
  na porta fixa 27018, para que a API e o seed se encontrem. Em produção esse fallback não
  existe: sem banco, a API não sobe.
- **Testes:** cada arquivo sobe um MongoDB só em memória. O `npm test` liga
  `CINECLUBE_PROIBIR_BANCO_DEV=1`, e qualquer tentativa de usar a porta 27018 ou
  `backend/data/db` falha em vez de gravar no banco de desenvolvimento.
- **Carga:** banco em memória na porta 27200 e a API com o diretório de trabalho fora do
  repositório, para não ler o `.env` real.

## Consequências

- `npm run dev` funciona numa máquina limpa, só com Node.
- O primeiro uso baixa o binário do MongoDB (cache em `~/.cache/mongodb-binaries`).
- O banco embutido morre com o processo que o iniciou; o seed avisa e espera a API sair
  quando foi ele quem subiu o banco.
