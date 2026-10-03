# Metodologia

Esta seção descreve como o trabalho foi organizado, as ferramentas usadas para manter o
código e os demais artefatos, e o processo seguido do levantamento à implantação.

## Gerenciamento de Projeto

O projeto foi desenvolvido por um único desenvolvedor em colaboração com a equipe do
Cineclube XHY, que atuou como cliente. Por isso, em vez de um Scrum completo, adotou-se um
processo **iterativo e incremental** inspirado no Scrum: ciclos curtos que terminam com
uma versão funcional apresentada ao cineclube, cujo retorno alimenta o ciclo seguinte.

### Divisão de Papéis

- **Product Owner:** a equipe do Cineclube XHY (coordenação, editorial e design), que
  forneceu o material impresso de referência, definiu as seções do site e validou cada
  entrega.
- **Desenvolvimento, design de interface e testes:** Jefferson Luiz Mendonça da Silva.

### Processo

O trabalho foi dividido em três iterações, cada uma registrada como uma versão no
[histórico do código-fonte](../codigo-fonte/README.md#hist%C3%B3rico-de-vers%C3%B5es):

| Iteração | Versão | Entrega |
|---|---|---|
| 1 — Fundação | 1.0.0 (abril/2026) | Modelagem dos dados, API REST, todas as páginas públicas conforme a diagramação impressa, script de dados de exemplo. |
| 2 — Publicação autônoma | 1.1.0 (julho/2026) | Painel do editor com login, editor de textos em blocos, upload de imagens, rascunhos, reordenação; gestão de catálogos, ciclos e filmes; logo e ícones oficiais. |
| 3 — Preparação para o público | 1.2.0 (setembro/2026) | Layout responsivo, metatags de compartilhamento, favicon, páginas de erro, `robots`/`sitemap`, armazenamento de imagens em nuvem, limite de tentativas de login, arquivos de implantação e guia de hospedagem. |

Dentro de cada iteração as tarefas seguiram o fluxo **Backlog → A fazer → Em andamento →
Concluído**, com os seguintes critérios para uma tarefa ser considerada concluída: código
compilando sem erros de tipo, funcionalidade verificada no navegador (desktop e celular)
e, quando aplicável, caso de teste registrado no
[Registro de Testes](08-Registro%20de%20Testes%20de%20Software.md).

### Etiquetas

As tarefas foram classificadas pela natureza da atividade:

- **Funcionalidade** — nova capacidade do site ou do painel
- **Interface** — diagramação, responsividade, identidade visual
- **Correção** — comportamento incorreto (por exemplo, links de textos de catálogo que
  apontavam para rota inexistente)
- **Infraestrutura** — banco de dados, hospedagem, variáveis de ambiente, automações
- **Documentação** — README, guias e esta documentação
- **Testes** — plano e registro de testes

## Ferramentas

| Ambiente | Plataforma | Link de acesso |
|---|---|---|
| Repositório de código-fonte e documentação | GitHub | https://github.com/jeffersonluizm/projeto-site-de-cinema |
| Editor de código | Visual Studio Code | https://code.visualstudio.com |
| Ambiente de execução | Node.js 18+ | https://nodejs.org |
| Banco de dados | MongoDB Atlas (cluster M0) e MongoDB embutido em desenvolvimento | https://cloud.mongodb.com |
| Armazenamento de imagens | Cloudinary | https://cloudinary.com |
| Hospedagem do site | Vercel | https://vercel.com |
| Hospedagem da API | Render (Blueprint em `render.yaml`) | https://render.com |
| Automação | GitHub Actions (keep-alive da API) | `.github/workflows/keep-alive.yml` |
| Referência de design | Catálogos impressos e identidade visual do Cineclube XHY | pasta `apresentacao/` |
| Testes de interface | Microsoft Edge (emulação de dispositivos) e Puppeteer | — |

## Estratégia de Organização de Codificação

Todo o código fica na pasta [`codigo-fonte`](../codigo-fonte), dividida em dois projetos
independentes que se comunicam por HTTP:

```
codigo-fonte/
├── backend/                 API REST — Express + TypeScript + Mongoose
│   └── src/
│       ├── models/          Esquemas do MongoDB (Magazine, Article, Catalog, Cycle, Film, About)
│       ├── routes/          Rotas públicas (revista, catalogos, ciclos, sobre, home)
│       │                    e protegidas (auth, upload, admin)
│       ├── middleware/      Autenticação JWT
│       └── lib/             Utilitários (slugify)
└── frontend/                Site — Next.js 14 (App Router) + TypeScript + Tailwind CSS
    └── src/
        ├── app/             Rotas: (listas)/ para páginas de listagem, pastas dinâmicas
        │                    para detalhes, admin/ para o painel
        ├── components/      Componentes públicos (PageShell, Sidebar, ArticleBody…)
        │   └── admin/       Formulários e editor de blocos do painel
        └── lib/             Cliente da API, tipos, SEO e utilitários
```

Convenções adotadas:

- **Controle de versão:** Git com branch única `main`; mensagens de commit em português
  descrevendo o que muda e por quê; versões marcadas no histórico do README.
- **Segredos fora do código:** senhas, chaves e URLs de banco ficam em arquivos `.env`
  ignorados pelo Git, com `.env.example` documentando cada variável.
- **Tipagem:** TypeScript em modo `strict` nos dois projetos; tipos da API compartilhados
  em `frontend/src/lib/types.ts`.
- **Estilo:** Tailwind CSS com a paleta e as fontes do cineclube definidas em
  `tailwind.config.ts`; nenhuma cor ou fonte declarada fora dessa configuração.
- **Conteúdo como dados:** todo texto publicado vive no banco e é editado pelo painel;
  o código não contém conteúdo editorial.
