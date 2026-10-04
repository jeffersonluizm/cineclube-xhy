import type { Metadata } from 'next';
import PageShell from '@/components/PageShell';
import Breadcrumb from '@/components/Breadcrumb';
import { DATA_CARGA, RESUMO_CARGA } from '@/lib/resultadosCarga';

export const metadata: Metadata = {
  title: 'Como foi feito',
  description: 'Arquitetura, decisões técnicas, testes, resultados de carga e limitações do site do Cineclube XHY.',
  alternates: { canonical: '/como-foi-feito' },
};

const REPO = 'https://github.com/jeffersonluizm/projeto-site-de-cinema';

function Titulo({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="font-display font-black text-pink-escuro text-sm tracking-widest mt-12 mb-4 scroll-mt-6">
      {children}
    </h2>
  );
}

const p = 'font-serif text-text-dark text-base md:text-lg leading-relaxed mb-4';

/** Diagrama da arquitetura real (SVG no próprio código, sem imagem externa) */
function Diagrama() {
  const caixa = 'fill-papel stroke-text-dark';
  const texto = 'fill-text-dark font-sans';
  return (
    <figure className="my-8 max-w-3xl">
      <svg viewBox="0 0 720 300" role="img" aria-labelledby="diag-titulo diag-desc" className="w-full h-auto">
        <title id="diag-titulo">Arquitetura do site do Cineclube XHY</title>
        <desc id="diag-desc">
          O navegador acessa o site em Next.js na Vercel, que guarda as páginas em cache e busca os dados na API Express no Render.
          A API lê e grava no MongoDB Atlas e envia imagens para o Cloudinary. O painel do editor chama a API com um token e avisa o
          site para atualizar o cache.
        </desc>
        <defs>
          <marker id="seta" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0L10 5L0 10z" className="fill-text-dark" />
          </marker>
        </defs>
        <rect x="10" y="40" width="150" height="70" className={caixa} />
        <text x="85" y="70" textAnchor="middle" className={texto} fontSize="14" fontWeight="bold">navegador</text>
        <text x="85" y="92" textAnchor="middle" className={texto} fontSize="11">site e painel</text>

        <rect x="230" y="40" width="190" height="70" className={caixa} />
        <text x="325" y="65" textAnchor="middle" className={texto} fontSize="14" fontWeight="bold">Next.js 14 (Vercel)</text>
        <text x="325" y="84" textAnchor="middle" className={texto} fontSize="11">páginas em cache 60 s</text>
        <text x="325" y="100" textAnchor="middle" className={texto} fontSize="11">/api/revalidar, RSS, sitemap</text>

        <rect x="490" y="40" width="220" height="70" className={caixa} />
        <text x="600" y="65" textAnchor="middle" className={texto} fontSize="14" fontWeight="bold">API Express (Render)</text>
        <text x="600" y="84" textAnchor="middle" className={texto} fontSize="11">zod, helmet, limites, JWT</text>
        <text x="600" y="100" textAnchor="middle" className={texto} fontSize="11">rotas públicas e do painel</text>

        <rect x="420" y="200" width="160" height="60" className={caixa} />
        <text x="500" y="226" textAnchor="middle" className={texto} fontSize="14" fontWeight="bold">MongoDB Atlas</text>
        <text x="500" y="245" textAnchor="middle" className={texto} fontSize="11">índices e busca de texto</text>

        <rect x="600" y="200" width="110" height="60" className={caixa} />
        <text x="655" y="235" textAnchor="middle" className={texto} fontSize="13" fontWeight="bold">Cloudinary</text>

        <line x1="160" y1="75" x2="228" y2="75" className="stroke-text-dark" strokeWidth="1.5" markerEnd="url(#seta)" />
        <line x1="420" y1="75" x2="488" y2="75" className="stroke-text-dark" strokeWidth="1.5" markerEnd="url(#seta)" />
        <line x1="560" y1="110" x2="520" y2="198" className="stroke-text-dark" strokeWidth="1.5" markerEnd="url(#seta)" />
        <line x1="640" y1="110" x2="655" y2="198" className="stroke-text-dark" strokeWidth="1.5" markerEnd="url(#seta)" />
        <path d="M85 110 C 85 170, 400 170, 560 112" fill="none" className="stroke-pink-escuro" strokeWidth="1.5" strokeDasharray="5 4" markerEnd="url(#seta)" />
        <text x="250" y="168" className="fill-pink-escuro font-sans" fontSize="11">painel: chamadas com token</text>
      </svg>
      <figcaption className="font-sans text-xs text-text-suave mt-2">Arquitetura em produção (todas as peças em planos gratuitos).</figcaption>
    </figure>
  );
}

export default function ComoFoiFeitoPage() {
  return (
    <PageShell mainClassName="max-w-4xl">
      <Breadcrumb crumbs={[{ label: 'sobre', href: '/sobre' }, { label: 'como foi feito' }]} />
      <h1 className="font-display font-black text-text-dark text-titulo-lista mb-6">como foi feito</h1>

      <p className={p}>
        Este site leva para a web o que o Cineclube XHY já publicava em papel e em imagens de rede social: a revista, os catálogos
        das mostras e a programação das exibições. É feito para dois públicos: quem lê e frequenta as sessões, muitas vezes pelo
        celular, e a equipe, que publica tudo sozinha por um painel próprio, sem mexer em código.
      </p>

      <nav aria-label="nesta página" className="font-display text-sm flex flex-wrap gap-x-5 gap-y-1 mb-4">
        {[
          ['arquitetura', 'arquitetura'],
          ['decisoes', 'decisões'],
          ['testes', 'testes'],
          ['carga', 'teste de carga'],
          ['limitacoes', 'limitações'],
          ['autoria', 'quem fez'],
        ].map(([id, rotulo]) => (
          <a key={id} href={`#${id}`} className="text-azul-escuro underline hover:text-olive-escuro">
            {rotulo}
          </a>
        ))}
      </nav>

      <Titulo id="arquitetura">ARQUITETURA</Titulo>
      <p className={p}>
        Dois projetos em TypeScript que conversam por HTTP. O <strong>site</strong> é Next.js 14 (App Router) com Tailwind; o{' '}
        <strong>backend</strong> é uma API Express com Mongoose sobre MongoDB. Imagens vão para o Cloudinary. Em desenvolvimento,
        sem MongoDB instalado, a API sobe um banco embutido; os testes usam um banco só em memória.
      </p>
      <Diagrama />

      <Titulo id="decisoes">DECISÕES TÉCNICAS</Titulo>
      <ul className="font-serif text-text-dark text-base md:text-lg leading-relaxed list-disc pl-6 flex flex-col gap-3">
        <li>
          <strong>Cache com revalidação sob demanda.</strong> As páginas guardam os dados por 60 segundos e o painel avisa o site a
          cada alteração. O visitante não espera a API a cada clique e o editor vê o que publicou na hora.
        </li>
        <li>
          <strong>Erro não é vazio.</strong> Se a API cai, o site diz que o serviço está indisponível (status 500) em vez de mostrar
          uma lista vazia ou um 404 falso. Páginas de conteúdo não usam streaming para que o 404 seja um 404 de verdade.
        </li>
        <li>
          <strong>Uma senha de equipe, com cuidado.</strong> O painel é de uma pessoa ou de uma equipe pequena: senha única,
          comparada por hash em tempo constante, limite de tentativas, token de 8 horas e re-login sem perder o que foi digitado.
        </li>
        <li>
          <strong>Validação na entrada.</strong> Todo dado do painel passa por esquemas zod antes do banco; links só{' '}
          <code>https:</code> ou <code>mailto:</code>; imagens conferidas pelos bytes, não pelo nome.
        </li>
        <li>
          <strong>Identidade em tokens.</strong> As cores do material impresso ficam num arquivo só, com variantes mais escuras
          para texto pequeno; um teste automatizado confere o contraste WCAG AA de cada combinação usada.
        </li>
        <li>
          <strong>Consultas com número fixo.</strong> A página inicial deixou de fazer uma consulta por edição; listas trazem só os
          campos que mostram; os filtros mais usados têm índice.
        </li>
      </ul>

      <Titulo id="testes">TESTES</Titulo>
      <p className={p}>
        A API tem testes automatizados com <code>node:test</code> e supertest sobre um MongoDB em memória: rotas públicas, CRUD do
        painel, validação, segurança (CORS, cabeçalhos, limites, upload), busca e a proteção que impede os testes de tocar no banco
        de desenvolvimento. O site testa as regras sem interface: contraste dos tokens, leitura da sessão, destino seguro depois do
        login e o RSS. O código e os resultados estão no{' '}
        <a href={REPO} className="text-azul-escuro underline hover:text-olive-escuro">
          repositório
        </a>
        .
      </p>

      <Titulo id="carga">TESTE DE CARGA</Titulo>
      <p className={p}>
        Medido com k6 numa cópia descartável do sistema (banco em memória, dados gerados), antes e depois das correções, na mesma
        máquina que gerava a carga. Os números servem para comparar as duas versões, não como capacidade de produção.
      </p>
      {RESUMO_CARGA.length > 0 ? (
        <div className="overflow-x-auto mb-4">
          <table className="font-sans text-sm text-text-dark border-collapse w-full min-w-[36rem]">
            <caption className="text-left font-serif italic text-text-suave mb-2">Medição de {DATA_CARGA}</caption>
            <thead>
              <tr className="border-b-2 border-text-dark text-left">
                <th scope="col" className="py-2 pr-4">cenário</th>
                <th scope="col" className="py-2 pr-4">antes</th>
                <th scope="col" className="py-2 pr-4">depois</th>
                <th scope="col" className="py-2">conclusão</th>
              </tr>
            </thead>
            <tbody>
              {RESUMO_CARGA.map((l) => (
                <tr key={l.cenario} className="border-b border-text-dark/20 align-top">
                  <th scope="row" className="py-2 pr-4 text-left font-normal">{l.cenario}</th>
                  <td className="py-2 pr-4">{l.antes}</td>
                  <td className="py-2 pr-4">{l.depois}</td>
                  <td className="py-2">{l.conclusao}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="font-serif italic text-text-suave">Resultados em docs/carga no repositório.</p>
      )}

      <Titulo id="limitacoes">LIMITAÇÕES</Titulo>
      <ul className="font-serif text-text-dark text-base md:text-lg leading-relaxed list-disc pl-6 flex flex-col gap-3">
        <li>Não há contas individuais: a equipe divide uma senha, então o painel não registra quem alterou o quê.</li>
        <li>O token do painel fica no navegador (localStorage). A política de conteúdo (CSP) reduz o risco, mas não substitui um cookie protegido.</li>
        <li>Na hospedagem gratuita a API dorme sem visitas; o cache das páginas esconde isso para quem lê, não para quem edita.</li>
        <li>As datas da programação são texto livre: ainda não dá para listar &ldquo;próximas sessões&rdquo; automaticamente.</li>
        <li>Não há newsletter nem formulário de contato, por escolha: evitam guardar dados pessoais. O RSS cumpre o papel de acompanhar as publicações.</li>
      </ul>

      <Titulo id="autoria">QUEM FEZ</Titulo>
      <p className={p}>
        Projeto, design de interface, desenvolvimento, testes e documentação: Jefferson Luiz Mendonça da Silva, para o Cineclube XHY.
        A identidade visual (logo, cores e tipografia) vem do material impresso do próprio cineclube.
      </p>
    </PageShell>
  );
}
