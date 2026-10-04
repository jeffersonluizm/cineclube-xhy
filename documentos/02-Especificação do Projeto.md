# Especificação do Projeto

Esta seção define a solução a partir da perspectiva de quem a usa. Parte das personas
identificadas na [Documentação de Contexto](01-Documenta%C3%A7%C3%A3o%20de%20Contexto.md),
deriva delas as histórias de usuário e, a partir das histórias, os requisitos funcionais
e não funcionais e as restrições do projeto.

## Personas

| **Nome** | **Idade** | **Perfil** | **Frustrações** | **Expectativas** |
|---|---|---|---|---|
| **Helena** | 52 | Coordenação do cineclube, professora universitária | A produção do cineclube não tem um lugar permanente; textos se perdem no feed. Plataformas prontas descaracterizam a identidade gráfica. | Um site que pareça a revista impressa, onde a equipe esteja apresentada e cada texto tenha endereço estável para citação. |
| **Caio** | 27 | Editor da Revista XHY | Depender de alguém que "mexa no código" para publicar um texto. Formatação de imagens e notas de rodapé que não saem como no impresso. | Escrever e publicar sozinho, com imagens no meio do texto, epígrafe e notas. Salvar rascunho e ver o resultado antes de publicar. |
| **Bia** | 25 | Designer do cineclube | Ver a paleta, a tipografia e a diagramação dos catálogos serem perdidas na web. Sites que ficam quebrados no celular. | Que o site reproduza cores, fontes e o ritmo visual do impresso em qualquer tamanho de tela. |
| **Marina** | 21 | Estudante de cinema, segue o cineclube no Instagram | Clicar no link da bio e cair numa página que não abre direito no celular, ou não achar a programação da sessão. | Abrir o link no celular e ler com conforto; achar rápido "o que vai passar" e "quem escreveu". |
| **Rafael** | 34 | Pesquisador, escreve sobre cinema brasileiro | Encontrar um texto ótimo numa imagem de Instagram, sem autor identificável nem link citável. | Buscar pelo nome de um cineasta e encontrar o texto do cineclube com autor, edição e URL permanente. |

## Histórias de Usuários

| **Persona** | **Como** | **Quero** | **Para que** |
|---|---|---|---|
| Caio | editor da revista | entrar no painel com uma senha e criar uma nova edição com número, volume, mês, ano e capa | a edição apareça no site como a mais recente |
| Caio | editor da revista | escrever um texto em blocos (parágrafo, subtítulo, citação, imagem) e inserir imagens em qualquer ponto com legenda, tamanho e alinhamento | o texto na web tenha a mesma diagramação do impresso |
| Caio | editor da revista | salvar um texto como rascunho e publicá-lo só quando estiver pronto | ninguém veja um texto incompleto |
| Caio | editor da revista | reordenar os textos de uma edição arrastando | o sumário siga a ordem editorial |
| Caio | editor de catálogo | cadastrar um catálogo com capa e descrição e adicionar textos por seção | o catálogo da mostra fique disponível junto da revista |
| Helena | coordenação | cadastrar um ciclo com programação de sessões (data, hora, filme, direção, duração, país) e páginas de filmes | o público consulte a programação e leia sobre cada filme |
| Helena | coordenação | editar o texto de apresentação e a lista da equipe com função, e-mail e links | a página "sobre" esteja sempre atualizada |
| Bia | designer | que o site use a paleta, as fontes e o layout de coluna lateral definidos para o cineclube | a identidade visual se mantenha |
| Marina | seguidora no celular | abrir um link do Instagram e ler o texto sem zoom nem rolagem lateral | a leitura seja confortável no celular |
| Marina | seguidora | ver na página inicial a última publicação e navegar para edições anteriores | eu descubra o que há de novo e o que já saiu |
| Rafael | pesquisador | que cada texto tenha URL própria, título, autor e edição, e apareça em buscadores | eu possa citar e encontrar os textos |
| Rafael | pesquisador | que ao compartilhar um link o título, o autor e a capa apareçam na prévia | a divulgação em grupos seja clara |

## Requisitos

### Requisitos Funcionais

| ID | Descrição do Requisito | Prioridade |
|---|---|---|
| **RF-001** | A página inicial deve exibir a publicação mais recente (revista ou catálogo) em destaque e permitir navegar entre as edições anteriores. | ALTA |
| **RF-002** | O site deve listar as edições da revista por ano e exibir, para cada edição, capa, editorial e sumário agrupado por coluna. | ALTA |
| **RF-003** | O site deve exibir cada texto da revista com título, autor, coluna, epígrafe, corpo em blocos (parágrafo, subtítulo, citação, imagem com legenda) e notas, com navegação para o texto anterior e o seguinte. | ALTA |
| **RF-004** | O site deve listar catálogos por ano e exibir cada catálogo com capa, descrição e textos agrupados por seção, cada texto com página própria. | ALTA |
| **RF-005** | O site deve listar ciclos e mostras por ano e exibir cada um com título, subtítulo, apresentação, programação de sessões e página individual por filme (direção, ano, duração, país, sinopse, texto). | ALTA |
| **RF-006** | O site deve exibir a página "sobre" com texto de apresentação e equipe agrupada por função, com e-mail e links. | MÉDIA |
| **RF-007** | O painel do editor deve exigir autenticação por senha e emitir uma sessão com validade limitada. | ALTA |
| **RF-008** | O painel deve permitir criar, editar e excluir revistas, catálogos, ciclos, filmes e textos. | ALTA |
| **RF-009** | O editor de textos deve trabalhar em blocos, permitir inserir imagens em qualquer ponto com legenda, largura (pequena, média, grande) e alinhamento (total, centro, esquerda, direita), e reordenar blocos por arrastar ou setas. | ALTA |
| **RF-010** | O painel deve permitir upload de imagens (jpg, png, webp, gif, avif, svg) de até 10 MB e devolver a URL para uso no conteúdo. | ALTA |
| **RF-011** | Textos devem poder ficar em rascunho; apenas textos publicados aparecem nas páginas públicas. | ALTA |
| **RF-012** | O painel deve permitir reordenar textos de uma edição e filmes de um ciclo. | MÉDIA |
| **RF-013** | Cada página pública deve fornecer título, descrição e imagem para prévia de compartilhamento (Open Graph) e URL canônica. | MÉDIA |
| **RF-014** | O site deve gerar `robots.txt` e `sitemap.xml` automaticamente e manter o painel fora da indexação. | BAIXA |
| **RF-015** | Páginas inexistentes devem responder com status 404 e uma página de erro com a identidade visual do site. | BAIXA |

### Requisitos Não Funcionais

| ID | Descrição do Requisito | Prioridade |
|---|---|---|
| **RNF-001** | **Responsividade:** todas as páginas públicas devem funcionar sem rolagem horizontal em larguras de 375 px (celular), 768 px (tablet) e 1440 px (desktop). | ALTA |
| **RNF-002** | **Identidade visual:** o site deve usar a paleta do cineclube (creme, roxo escuro, rosa, oliva, dourado, azul) e as fontes Cormorant Garamond, Nunito e Inter. | ALTA |
| **RNF-003** | **Segurança:** rotas de escrita exigem token JWT; o login limita tentativas por IP; em produção o servidor exige segredos definidos e só aceita origens configuradas (CORS); tráfego em HTTPS. | ALTA |
| **RNF-004** | **Desempenho:** fontes servidas pelo próprio site, imagens do corpo do texto carregadas sob demanda e JavaScript inicial das páginas públicas abaixo de 110 kB. | MÉDIA |
| **RNF-005** | **Custo:** a arquitetura deve ser hospedável sem custo (Vercel, Render, MongoDB Atlas M0, Cloudinary), com domínio próprio. | ALTA |
| **RNF-006** | **Persistência de mídia:** imagens enviadas pelo editor devem sobreviver a reimplantações do servidor (armazenamento externo). | ALTA |
| **RNF-007** | **Acessibilidade básica:** foco visível no teclado, textos alternativos nas imagens, rótulos nos controles e respeito a `prefers-reduced-motion`. | MÉDIA |
| **RNF-008** | **Manutenibilidade:** código em TypeScript no frontend e no backend, com estrutura de componentes reutilizáveis e documentação de execução e implantação. | MÉDIA |

## Restrições

| ID | Restrição |
|---|---|
| **R-01** | O projeto deve ser concluído dentro do semestre letivo, por um único desenvolvedor. |
| **R-02** | A hospedagem não pode ter custo mensal; o único gasto admitido é o domínio. |
| **R-03** | O painel usa uma única senha de editor compartilhada pela equipe; não há cadastro de usuários nem perfis distintos. |
| **R-04** | O site não possui área de comentários, cadastro de leitores nem newsletter. |
| **R-05** | O conteúdo é publicado apenas em português. |
| **R-06** | A identidade visual segue o material impresso do cineclube e não pode ser alterada sem aprovação da equipe de design. |
