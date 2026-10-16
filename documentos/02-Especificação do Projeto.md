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

Status em 04/10/2026 (versão 1.3.0). "Atendido" significa implementado e coberto por teste
automatizado ou por caso do [plano de testes](07-Plano%20de%20Testes%20de%20Software.md).

### Requisitos Funcionais

| ID | Descrição do Requisito | Prioridade | Status |
|---|---|---|---|
| **RF-001** | A página inicial deve exibir a publicação mais recente (revista ou catálogo) em destaque e permitir navegar entre as edições anteriores. | ALTA | Atendido (1.0.0; acessível por teclado e leitor de tela em 1.3.0) |
| **RF-002** | O site deve listar as edições da revista por ano e exibir, para cada edição, capa, editorial e sumário agrupado por coluna. | ALTA | Atendido |
| **RF-003** | O site deve exibir cada texto da revista com título, autor, coluna, epígrafe, corpo em blocos (parágrafo, subtítulo, citação, imagem com legenda) e notas, com navegação para o texto anterior e o seguinte. | ALTA | Atendido (notas com âncoras em 1.3.0) |
| **RF-004** | O site deve listar catálogos por ano e exibir cada catálogo com capa, descrição e textos agrupados por seção, cada texto com página própria. | ALTA | Atendido |
| **RF-005** | O site deve listar ciclos e mostras por ano e exibir cada um com título, subtítulo, apresentação, notas, programação de sessões, textos do ciclo e página individual por filme (direção, ano, duração, país, sinopse, texto). | ALTA | Atendido (textos do ciclo e notas em 1.3.0) |
| **RF-006** | O site deve exibir a página "sobre" com texto de apresentação e equipe agrupada por função, com e-mail e links. | MÉDIA | Atendido |
| **RF-007** | O painel do editor deve exigir autenticação por senha e emitir uma sessão com validade limitada. | ALTA | Atendido (8 h desde 1.3.0) |
| **RF-008** | O painel deve permitir criar, editar e excluir revistas, catálogos, ciclos, filmes e textos. | ALTA | Atendido |
| **RF-009** | O editor de textos deve trabalhar em blocos, permitir inserir imagens em qualquer ponto com legenda, largura (pequena, média, grande) e alinhamento (total, centro, esquerda, direita), e reordenar blocos por arrastar ou setas. | ALTA | Atendido |
| **RF-010** | O painel deve permitir upload de imagens (jpg, png, webp, gif, avif) de até 10 MB e devolver a URL para uso no conteúdo. | ALTA | Atendido (tipo conferido pelos bytes em 1.3.0) |
| **RF-011** | Textos devem poder ficar em rascunho; apenas textos publicados aparecem nas páginas públicas. | ALTA | Atendido |
| **RF-012** | O painel deve permitir reordenar textos de revistas, catálogos e ciclos e os filmes de um ciclo. | MÉDIA | Atendido |
| **RF-013** | Cada página pública deve fornecer título, descrição e imagem para prévia de compartilhamento (Open Graph) e URL canônica. | MÉDIA | Atendido (imagem própria por texto em 1.3.0) |
| **RF-014** | O site deve gerar `robots.txt` e `sitemap.xml` automaticamente e manter o painel fora da indexação. | BAIXA | Atendido (sitemap com textos, filmes e autores; `noindex` no painel) |
| **RF-015** | Páginas inexistentes devem responder com status 404 e uma página de erro com a identidade visual do site. | BAIXA | Atendido |
| **RF-016** | O site deve oferecer busca por textos publicados, filmes e autores, sem diferenciar acentos. | MÉDIA | Atendido (1.3.0) |
| **RF-017** | Cada autor deve ter uma página com os seus textos publicados. | BAIXA | Atendido (1.3.0) |
| **RF-018** | O site deve publicar um feed RSS com os textos mais recentes (alternativa à newsletter, sem guardar dados pessoais). | BAIXA | Atendido (1.3.0) |
| **RF-019** | Falha da API deve aparecer como "serviço indisponível", distinta de página inexistente e de lista vazia. | ALTA | Atendido (1.3.0) |
| **RF-020** | O painel deve abrir num início com contagens, rascunhos pendentes e textos editados por último. | MÉDIA | Atendido (1.3.0) |
| **RF-021** | O painel deve ter páginas próprias de entrar, esqueci a senha (explicando o processo real), sessão expirada e sair. | ALTA | Atendido (1.3.0) |
| **RF-022** | Se a sessão expirar durante uma edição, o painel deve pedir a senha sem perder o que foi digitado e guardar um rascunho local dos textos. | ALTA | Atendido (1.3.0) |
| **RF-023** | Excluir revista, catálogo ou exibição deve mostrar o que vai junto e pedir confirmação digitada; toda ação do painel deve informar sucesso ou erro. | ALTA | Atendido (1.3.0) |
| **RF-024** | Cada sessão da programação deve apontar para a página do filme escolhida pelo editor. | MÉDIA | Atendido (1.3.0, `filmId`) |
| **RF-025** | O site deve ter uma página "como foi feito" com arquitetura, decisões, testes, carga e limitações. | BAIXA | Atendido (1.3.0) |

### Requisitos Não Funcionais

| ID | Descrição do Requisito | Prioridade | Status |
|---|---|---|---|
| **RNF-001** | **Responsividade:** todas as páginas públicas devem funcionar sem rolagem horizontal em larguras de 375 px (celular), 768 px (tablet) e 1440 px (desktop). | ALTA | Atendido |
| **RNF-002** | **Identidade visual:** o site deve usar a paleta do cineclube (creme, roxo escuro, rosa, oliva, dourado, azul) e as fontes Cormorant Garamond, Nunito e Inter, com as cores definidas num único arquivo de tokens. | ALTA | Atendido (`frontend/src/lib/tokens.ts`) |
| **RNF-003** | **Segurança:** rotas de escrita exigem token JWT; o login limita tentativas por IP; há limite geral por IP; em produção o servidor exige segredos definidos e só aceita origens configuradas (CORS); cabeçalhos de segurança e CSP no site e na API; tráfego em HTTPS. | ALTA | Atendido |
| **RNF-004** | **Desempenho:** fontes servidas pelo próprio site, imagens do corpo do texto carregadas sob demanda, JavaScript inicial das páginas públicas abaixo de 110 kB e consultas ao banco em número fixo por página. | MÉDIA | Atendido (100 kB; medição em `docs/carga/`) |
| **RNF-005** | **Custo:** a arquitetura deve ser hospedável sem custo (Vercel, Render, MongoDB Atlas M0, Cloudinary), com domínio próprio. | ALTA | Atendido |
| **RNF-006** | **Persistência de mídia:** imagens enviadas pelo editor devem sobreviver a reimplantações do servidor (armazenamento externo). | ALTA | Atendido |
| **RNF-007** | **Acessibilidade:** contraste WCAG AA verificado por teste, foco visível, link para pular ao conteúdo, textos alternativos, rótulos, erros anunciados e respeito a `prefers-reduced-motion`. | MÉDIA | Atendido (1.3.0) |
| **RNF-008** | **Manutenibilidade:** código em TypeScript no frontend e no backend, rotas por recurso, componentes reutilizáveis e documentação de execução e implantação. | MÉDIA | Atendido |
| **RNF-009** | **Validação:** toda entrada do painel deve ser validada no servidor (tipos, tamanhos, ids, URLs seguras) antes de chegar ao banco. | ALTA | Atendido (zod + `runValidators`) |
| **RNF-010** | **Testes:** a API e as regras do front devem ter testes automatizados que rodam sem banco externo. | ALTA | Atendido (ver documento 08) |

## Restrições

| ID | Restrição |
|---|---|
| **R-01** | O projeto deve ser concluído dentro do semestre letivo, por um único desenvolvedor. |
| **R-02** | A hospedagem não pode ter custo mensal; o único gasto admitido é o domínio. |
| **R-03** | O painel usa uma única senha de editor compartilhada pela equipe; não há cadastro de usuários nem perfis distintos. |
| **R-04** | O site não possui área de comentários, cadastro de leitores nem newsletter (o RSS cumpre o papel de acompanhar as publicações sem guardar dados pessoais). |
| **R-05** | O conteúdo é publicado apenas em português. |
| **R-06** | A identidade visual segue o material impresso do cineclube e não pode ser alterada sem aprovação da equipe de design. |
