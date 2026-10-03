# Documentação de Contexto

## Introdução

O **Cineclube XHY** é um coletivo que se reúne para assistir, discutir e escrever sobre
cinema fora dos circuitos comerciais. Ao longo de sua atividade o cineclube passou a
produzir um conjunto consistente de material próprio: a **Revista XHY**, publicação
periódica com textos críticos organizados em colunas; **catálogos** que acompanham as
mostras dedicadas a cineastas e temas (Júlio Bressane, David Lynch, Salomé, Sirk &
Fassbinder, atrizes); e a programação de **ciclos e exibições**, com sessões, fichas
técnicas e textos sobre cada filme.

Até então esse material circulava de forma dispersa: PDFs impressos, publicações no
Instagram, arquivos compartilhados entre integrantes. Não havia um lugar permanente onde
uma pessoa interessada pudesse ler um texto da revista, consultar a programação de uma
mostra ou conhecer a equipe.

Este projeto desenvolve o **site do Cineclube XHY**: uma publicação digital que reúne
revista, catálogos e exibições com a mesma identidade visual do material impresso, e um
**painel de editor** que permite à equipe publicar conteúdo sem depender de programação.

## Problema

O cineclube produz conteúdo editorial de qualidade, mas enfrenta três dificuldades para
torná-lo acessível:

1. **Dispersão.** Textos, catálogos e programações ficam espalhados em redes sociais e
   arquivos, sem endereço fixo. Um texto publicado hoje desaparece do feed em poucos dias
   e não pode ser citado ou encontrado por busca.
2. **Dependência técnica.** Soluções prontas de blog não reproduzem a diagramação
   editorial do cineclube (fundo escuro para leitura, epígrafes, notas laterais, imagens
   flutuando no texto). Manter um site sob medida, por outro lado, exigiria que a equipe
   editasse código a cada publicação.
3. **Leitura no celular.** O público chega principalmente pelo Instagram e pelo WhatsApp,
   em telas pequenas. O material impresso, pensado para papel, não se adapta a esse
   contexto.

## Objetivos

**Objetivo geral:** criar um site editorial para o Cineclube XHY que centralize revista,
catálogos e exibições, com publicação autônoma pela equipe e leitura confortável em
qualquer tela.

**Objetivos específicos:**

- Publicar a Revista XHY na web com sumário por edição, textos completos, epígrafes,
  notas e imagens no corpo do texto.
- Disponibilizar os catálogos das mostras com capa, apresentação e textos por seção.
- Apresentar ciclos e exibições com programação de sessões e página individual por filme.
- Manter uma página "sobre" com a apresentação do cineclube e a equipe com contatos.
- Oferecer um painel de editor protegido por senha, com editor de texto em blocos, upload
  de imagens, rascunhos e reordenação de conteúdo.
- Garantir que todas as páginas funcionem em celular, tablet e desktop, preservando a
  identidade visual do material impresso.
- Tornar cada página compartilhável em redes sociais, com título, descrição e imagem de
  destaque, e indexável por buscadores.
- Permitir hospedagem sem custo, com domínio próprio.

## Justificativa

Um cineclube vive de circulação: de filmes, de ideias e de textos. A revista e os
catálogos são a memória escrita dessa circulação, e hoje essa memória está frágil, presa
a formatos que não se acumulam nem se encontram.

Um site próprio resolve isso de forma duradoura. Cada texto ganha um endereço permanente,
que pode ser citado em trabalhos acadêmicos, compartilhado em grupos e encontrado por quem
pesquisa o nome de um cineasta. A programação de uma mostra deixa de ser uma imagem no
feed e vira uma página com ficha técnica e texto crítico.

A decisão de construir uma solução sob medida, em vez de usar uma plataforma pronta, vem
do valor que o cineclube dá à sua identidade gráfica. O site foi desenhado a partir da
diagramação dos catálogos impressos: paleta de cores, tipografia serifada, notas laterais
e a página inicial como uma "prateleira" de edições. Para que essa exigência de forma não
se tornasse uma barreira de publicação, o painel do editor foi tratado como parte central
do projeto, e não como acessório.

Por fim, a escolha de uma arquitetura hospedável gratuitamente (Vercel, Render, MongoDB
Atlas e Cloudinary) é uma condição de sustentabilidade para um coletivo sem orçamento.

## Público-Alvo

**Editoria do cineclube.** Integrantes responsáveis por escrever, revisar e publicar os
textos da revista e dos catálogos. Usam computador para editar, mas conferem o resultado
no celular. Têm familiaridade com editores de texto e redes sociais, não com código.
Precisam publicar com autonomia, salvar rascunhos e ajustar a ordem dos textos.

**Frequentadores e seguidores.** Pessoas que acompanham o cineclube pelo Instagram e
pelo WhatsApp e chegam ao site por um link compartilhado, quase sempre no celular. Querem
ler o texto que foi compartilhado, ver a programação da próxima sessão e descobrir edições
anteriores sem esforço.

**Estudantes e pesquisadores de cinema.** Buscam textos críticos sobre cineastas
específicos, com autoria identificada e endereço estável para citação. Chegam por
buscadores ou por referências em outros trabalhos. Valorizam a leitura longa sem
distrações e a presença de notas e referências.

**Coordenação do cineclube.** Responsável pela linha editorial e pela imagem pública do
coletivo. Precisa que o site represente a identidade visual com fidelidade e que a equipe
esteja apresentada com contatos atualizados.
