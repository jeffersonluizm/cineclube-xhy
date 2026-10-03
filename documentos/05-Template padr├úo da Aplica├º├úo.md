# Template padrão da Aplicação

O template define a estrutura comum a todas as páginas do site: a casca de navegação, a
identidade visual (cores, tipografia, iconografia) e as regras de responsividade. Ele é
implementado em componentes reutilizáveis do Next.js com Tailwind CSS, de modo que nenhuma
página declara cores ou fontes por conta própria.

## Estrutura das páginas

Todas as páginas internas usam o componente `PageShell`, que monta a casca e recebe o
conteúdo:

```
PageShell (tone: cream | dark)
├── Sidebar
│   ├── [celular]  header: logo · redes sociais · links do menu
│   └── [desktop]  aside 160px fixo: logo · menu vertical · redes sociais
├── main  (fundo creme ou roxo escuro conforme o tom)
│   ├── Breadcrumb
│   └── conteúdo da página
└── BackToTop  (aparece após rolar 400px)
```

A página inicial é a exceção: usa `TopNav` (cabeçalho horizontal) e ocupa exatamente a
altura da tela, sem rolagem, com o componente `HomeShowcase` alternando as edições.

Dois tons de página:

| Tom | Uso | Fundo | Texto |
|---|---|---|---|
| `cream` | navegação, listagens, sumários, sobre | creme `#F2EDD6` | roxo `#2B2040` |
| `dark` | leitura de textos e páginas de filme | roxo escuro `#261840` | creme `#F2EDD6` |

## Identidade visual

### Paleta

Definida em `tailwind.config.ts` e derivada dos catálogos impressos:

| Nome | Cor | Uso |
|---|---|---|
| `cream` | `#F2EDD6` | fundo principal e texto sobre fundo escuro |
| `dark-purple` | `#261840` | fundo das páginas de leitura |
| `text-dark` | `#2B2040` | texto sobre fundo claro |
| `pink` | `#E8368C` | breadcrumbs, autor, rótulos de seção, foco de teclado |
| `olive` | `#B5BB38` | hover de links, links externos, destaque de "próximo" |
| `gold` | `#C8A030` | anos nas listagens, epígrafes e citações |
| `blue-link` | `#6B72B8` | direção de filmes, e-mails, "texto anterior" |
| `light-text` | `#9090B8` | notas de rodapé e legendas sobre fundo escuro |

### Tipografia

Três famílias, servidas pelo próprio site via `next/font` (sem requisição ao Google Fonts
e sem troca visível de fonte no carregamento):

| Família | Papel | Onde |
|---|---|---|
| **Cormorant Garamond** (serifa) | leitura | corpo dos textos, epígrafes, citações, breadcrumbs, notas |
| **Nunito** (display) | títulos | títulos de página, números de edição, nomes, menu |
| **Inter** (sem serifa) | apoio | legendas de imagem, créditos, campos do painel |

Títulos usam `clamp()` para escalar com a tela: por exemplo, o título de um texto vai de
2,25 rem no celular a 5 rem no desktop.

### Iconografia

- **Logo** oficial do cineclube (`/logo/logo-xhy.png`), também usado como favicon e ícone
  de aplicativo.
- **Redes sociais:** Instagram, Letterboxd, YouTube (ícones PNG fornecidos pelo cineclube)
  e WhatsApp (SVG), todos com `aria-label`.
- **Navegação da home:** setas ▲ ▼ e pontos indicadores de edição.
- **Textos anterior/seguinte:** retângulos de cor (oliva para o próximo, azul para o
  anterior), como nos catálogos impressos.

## Responsividade

Pontos de quebra do Tailwind usados no projeto:

| Ponto | Largura | Comportamento |
|---|---|---|
| base | < 640 px | coluna única; barra superior com logo, redes e menu em linha; imagens do texto centralizadas; notas abaixo do texto; menu da home em linha própria |
| `sm` | ≥ 640 px | home volta a exibir capa e informações lado a lado, com lista de textos |
| `md` | ≥ 768 px | coluna lateral de 160 px; notas e epígrafes voltam para a lateral; imagens podem flutuar à esquerda ou à direita |
| `lg` | ≥ 1024 px | capa e sumário de revista/catálogo lado a lado |
| `xl` | ≥ 1440 px | sumário lateral duplicado na página da edição, como no impresso |

Regras globais em `globals.css`: `overflow-wrap: break-word` em títulos e parágrafos
(títulos longos de filmes não estouram a tela), foco visível em rosa para navegação por
teclado, e desativação de transições quando o sistema pede movimento reduzido.

## Estados especiais

| Estado | Comportamento |
|---|---|
| Carregando | Páginas de listagem mostram um esqueleto com a identidade do site enquanto a API responde |
| 404 | Página "fim da sessão" em fundo roxo com links para as seções, respondendo com status HTTP 404 |
| Erro | Página "projetor com defeito" com botão para tentar novamente |
| Sem conteúdo | Mensagem em itálico ("Nenhuma revista disponível", "Em breve...") |

| Barra superior no celular | Página 404 |
|---|---|
| ![Página inicial no celular](img/site-home-celular.png) | ![Página 404 no celular](img/site-404-celular.png) |
