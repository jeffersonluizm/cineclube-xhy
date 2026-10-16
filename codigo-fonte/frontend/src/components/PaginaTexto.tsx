import Link from 'next/link';
import PageShell from './PageShell';
import Breadcrumb from './Breadcrumb';
import ArticleBody from './ArticleBody';
import ArticleNav from './ArticleNav';
import { ChamadaNota } from './Notas';
import { slugAutor } from '@/lib/text';
import type { Article, Vizinho } from '@/lib/types';

interface PaginaTextoProps {
  article: Article;
  migalhas: { label: string; href?: string }[];
  prev: Vizinho | null;
  next: Vizinho | null;
  /** caminho base dos vizinhos (ex.: /revista/2/artigo) */
  baseVizinhos: string;
}

/** Leitura de um texto (revista, catálogo ou ciclo): mesma diagramação nos três lugares */
export default function PaginaTexto({ article, migalhas, prev, next, baseVizinhos }: PaginaTextoProps) {
  const temNotas = (article.footnotes ?? []).some((n) => n.trim());
  return (
    <PageShell tone="dark">
      <Breadcrumb tom="dark" crumbs={[...migalhas, { label: article.column }]} />

      <article>
        <h1 className="font-display font-black text-cream text-titulo-texto mb-4">{article.title}</h1>

        <p className="font-serif italic text-pink-claro text-lg mb-8 md:mb-10">
          por{' '}
          <Link href={`/autores/${slugAutor(article.author)}`} className="hover:underline">
            {article.author}
          </Link>
          {temNotas && <ChamadaNota n={1} />}
        </p>

        <ArticleBody content={article.content} blocks={article.blocks} epigraph={article.epigraph} footnotes={article.footnotes} />
      </article>

      <ArticleNav prev={prev} next={next} basePath={baseVizinhos} />
    </PageShell>
  );
}
