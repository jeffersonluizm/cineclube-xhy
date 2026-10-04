import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PageShell from '@/components/PageShell';
import Breadcrumb from '@/components/Breadcrumb';
import ArticleBody from '@/components/ArticleBody';
import ArticleNav from '@/components/ArticleNav';
import { api } from '@/lib/api';
import { pageMetadata } from '@/lib/seo';

interface Props {
  params: { slug: string; textSlug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { article, cycle } = await api.ciclos.text(params.slug, params.textSlug);
    return pageMetadata({
      title: `${article.title} · ${cycle.title}`,
      description: article.epigraph || article.content,
      path: `/ciclos-mostras/${cycle.slug}/texto/${article.slug}`,
      image: article.coverImage || cycle.coverImage,
      type: 'article',
      authors: [article.author],
    });
  } catch {
    return { title: 'Texto não encontrado' };
  }
}

export default async function CicloTextPage({ params }: Props) {
  let data;
  try {
    data = await api.ciclos.text(params.slug, params.textSlug);
  } catch {
    notFound();
  }

  const { article, cycle, prev, next } = data;

  return (
    <PageShell tone="dark">
      <Breadcrumb
        crumbs={[
          { label: 'exibições', href: '/ciclos-mostras' },
          { label: cycle.title.toLowerCase(), href: `/ciclos-mostras/${cycle.slug}` },
          { label: article.column },
        ]}
      />

      <article>
        <h1
          className="font-display font-black text-cream mb-4 leading-none"
          style={{ fontSize: 'clamp(2.25rem, 7vw, 5rem)' }}
        >
          {article.title}
        </h1>

        <p className="font-serif italic text-pink text-lg mb-8 md:mb-10">
          por {article.author}
          {article.footnotes && article.footnotes.length > 0 && <sup>1</sup>}
        </p>

        <ArticleBody
          content={article.content}
          blocks={article.blocks}
          epigraph={article.epigraph}
          footnotes={article.footnotes}
        />
      </article>

      <ArticleNav prev={prev} next={next} basePath={`/ciclos-mostras/${cycle.slug}/texto`} />
    </PageShell>
  );
}
