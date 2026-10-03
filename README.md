<p align="center">
  <img src="codigo-fonte/frontend/public/logo/logo-xhy.png" alt="Cineclube XHY" width="160">
</p>

<h1 align="center">Cineclube XHY — Site</h1>

<p align="center">
  Revista, catálogos e exibições do Cineclube XHY em um site editorial com painel de publicação próprio.
</p>

---

## Sobre o projeto

O Cineclube XHY reúne pessoas para pensar cinema coletivamente, fora dos circuitos comerciais.
Este projeto leva para a web o material que o cineclube já produz: a **Revista XHY**, os
**catálogos** das mostras e a programação de **ciclos e exibições**, além de uma página sobre
a equipe.

O site foi desenhado como uma publicação impressa: fundo creme para a navegação, fundo roxo
escuro para a leitura dos textos, tipografia serifada e uma página inicial que funciona como
uma "prateleira" de edições. Um painel de editor, protegido por senha, permite que a equipe do
cineclube publique revistas, textos, catálogos, ciclos e filmes sem mexer em código, com
editor de blocos e upload de imagens.

### Funcionalidades

- **Página inicial** com a última publicação em destaque e navegação entre edições
- **Revista** — listagem por ano, sumário de cada edição e leitura dos textos com epígrafe,
  imagens no corpo e notas laterais
- **Catálogos** — capa, apresentação e textos de cada catálogo
- **Exibições** — ciclos e mostras com programação de sessões e página de cada filme
- **Sobre** — apresentação do cineclube e equipe com contatos
- **Painel do editor** (`/admin`) — criação e edição de todo o conteúdo, editor de texto em
  blocos (parágrafo, subtítulo, citação, imagem) com arrastar e soltar, rascunhos e reordenação
- **Responsivo** — navegação lateral no desktop, barra compacta no celular
- **Compartilhável** — metatags Open Graph por página, favicon, `robots.txt` e `sitemap.xml`

### Tecnologias

| Camada | Stack |
|--------|-------|
| Frontend | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS |
| Backend | Node.js, Express, TypeScript, Mongoose |
| Banco de dados | MongoDB (Atlas em produção, embutido em desenvolvimento) |
| Imagens | Cloudinary (produção) ou disco local (desenvolvimento) |
| Autenticação | Senha única do editor com token JWT |

## Estrutura do repositório

```
├── codigo-fonte/          Código da aplicação
│   ├── backend/           API REST (Express + MongoDB)
│   ├── frontend/          Site (Next.js + Tailwind)
│   └── README.md          Como rodar, variáveis de ambiente, API e guia de hospedagem
├── documentos/            Documentação do projeto
├── apresentacao/          Identidade visual (logo) e materiais de apresentação
├── render.yaml            Blueprint de deploy da API no Render
└── .github/workflows/     Automação (keep-alive da API)
```

## Como rodar

Pré-requisito: Node.js 18 ou superior.

```bash
# API
cd codigo-fonte/backend
npm install
npm run dev          # http://localhost:3001

# Site (em outro terminal)
cd codigo-fonte/frontend
npm install
npm run dev          # http://localhost:3000
```

Sem um MongoDB configurado, a API sobe automaticamente um banco embutido para
desenvolvimento. Detalhes de configuração, variáveis de ambiente e rotas da API estão em
[`codigo-fonte/README.md`](codigo-fonte/README.md).

## Hospedagem

Arquitetura gratuita com domínio próprio, descrita passo a passo no
[guia de hospedagem](codigo-fonte/README.md#hospedagem-gratuita-com-dom%C3%ADnio-pr%C3%B3prio):

| Peça | Serviço |
|------|---------|
| Site | Vercel |
| API | Render (Blueprint em [`render.yaml`](render.yaml)) |
| Banco | MongoDB Atlas |
| Imagens | Cloudinary |

- **Endereço público:** _em breve_

## Documentação

1. [Documentação de Contexto](documentos/01-Documenta%C3%A7%C3%A3o%20de%20Contexto.md)
2. [Especificação do Projeto](documentos/02-Especifica%C3%A7%C3%A3o%20do%20Projeto.md)
3. [Metodologia](documentos/03-Metodologia.md)
4. [Projeto de Interface](documentos/04-Projeto%20de%20Interface.md)
5. [Template padrão da Aplicação](documentos/05-Template%20padr%C3%A3o%20da%20Aplica%C3%A7%C3%A3o.md)
6. [Programação de Funcionalidades](documentos/06-Programa%C3%A7%C3%A3o%20de%20Funcionalidades.md)
7. [Plano de Testes de Software](documentos/07-Plano%20de%20Testes%20de%20Software.md)
8. [Registro de Testes de Software](documentos/08-Registro%20de%20Testes%20de%20Software.md)
9. [Referências Bibliográficas](documentos/09-Refer%C3%AAncias%20Bibliogr%C3%A1ficas.md)

## Apresentação

- [Materiais de apresentação](apresentacao/README.md)
- [Identidade visual (logo e ícones)](codigo-fonte/frontend/public/)

## Desenvolvedor

**Jefferson Luiz Mendonça da Silva**
[LinkedIn](https://www.linkedin.com/in/j-luiz/) · [GitHub](https://github.com/jeffersonluizm) · [Letterboxd](https://letterboxd.com/Weinsmann/)

Projeto desenvolvido para o Cineclube XHY —
[Instagram](https://www.instagram.com/cinexhy247/) · [YouTube](https://www.youtube.com/@XHY-247) · [Letterboxd](https://boxd.it/b9dkB)
