# ADR 0001: uma senha única de editor, sem contas individuais

- **Status:** aceita (1.1.0), revista em 1.3.0
- **Data:** 04/10/2026

## Contexto

Quem publica é a equipe do Cineclube XHY: poucas pessoas, rotativas, sem papéis
distintos. O cineclube não queria administrar cadastro, convites e recuperação de senha
por e-mail, e a hospedagem é gratuita (sem serviço de e-mail transacional).

## Decisão

O painel tem uma senha única (`ADMIN_PASSWORD`, variável de ambiente da API). O login
emite um token de editor. A senha é comparada por hash SHA-256 em tempo constante; há
limite de 10 tentativas erradas por IP a cada 15 minutos e um teto global de 100 por hora;
em produção a API recusa senha com menos de 12 caracteres. O token carrega uma "versão da
senha": trocar `ADMIN_PASSWORD` derruba todas as sessões abertas.

"Esqueci a senha" é uma página honesta: explica que a senha vem da coordenação e como
trocá-la na hospedagem, sem prometer link de redefinição.

## Consequências

- Simples de operar e de entender; nenhum dado pessoal guardado.
- Não há trilha de "quem alterou o quê" nem permissões por pessoa.
- Quando alguém sai da equipe, a senha precisa ser trocada para todos.
- Caminho de evolução: contas individuais com papéis (editor, revisor) e histórico.
