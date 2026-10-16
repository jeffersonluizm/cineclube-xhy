# ADR 0005: cache de 60 s com revalidação sob demanda no site

- **Status:** aceita (1.3.0), substitui o `no-store` da 1.2.0
- **Data:** 04/10/2026

## Contexto

Na 1.2.0 toda página pública chamava a API a cada visita (`cache: 'no-store'`), para que o
editor visse a publicação na hora. Na hospedagem gratuita a API dorme e acorda em até
60 s; além disso, o teste de carga mostrou que o site ficava limitado pela vazão da API.

## Decisão

- As páginas buscam os dados com `next: { revalidate: 60, tags: ['conteudo'] }`: o Next
  guarda a resposta e regenera a página em segundo plano.
- Cada escrita do painel chama `POST /api/revalidar` no site, que confere o token na API e
  invalida a etiqueta `conteudo`: o editor vê a mudança na próxima visita, sem esperar 60 s.
- Se a API estiver fora do ar no `next build`, a rota vira renderização por pedido em vez
  de quebrar o build.
- As páginas de conteúdo não usam `loading.tsx`: com streaming o Next responderia 200 antes
  de saber se a página existe, e o 404 deixaria de ser real.

## Consequências

- Visitantes recebem páginas do cache mesmo com a API dormindo ou fora do ar (conteúdo
  possivelmente com até 60 s de atraso).
- A primeira visita a uma página nunca vista ainda depende da API.
- Resultados medidos em `docs/carga/2026-10-04-resultados.md` (H9 e H10).
