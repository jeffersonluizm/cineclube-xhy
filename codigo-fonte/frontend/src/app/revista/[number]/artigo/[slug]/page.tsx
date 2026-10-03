import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PageShell from '@/components/PageShell';
import Breadcrumb from '@/components/Breadcrumb';
import ArticleBody from '@/components/ArticleBody';
import ArticleNav from '@/components/ArticleNav';
import { api } from '@/lib/api';
import { pageMetadata } from '@/lib/seo';

interface Props {
  params: { number: string; slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { article, magazine } = await api.revista.article(params.number, params.slug);
    return pageMetadata({
      title: article.title,
      description: article.epigraph || article.content,
      path: `/revista/${magazine.number}/artigo/${article.slug}`,
      image: article.coverImage || magazine.coverImage,
      type: 'article',
      authors: [article.author],
    });
  } catch {
    return { title: 'Texto não encontrado' };
  }
}

export default async function ArticlePage({ params }: Props) {
  let data;
  try {
    data = await api.revista.article(params.number, params.slug);
  } catch {
    notFound();
  }

  const { article, magazine, prev, next } = data;

  return (
    <PageShell tone="dark">
      <Breadcrumb
        crumbs={[
          { label: 'revista xhy', href: '/revista' },
          {
            label: `n°${magazine.number}, v.${magazine.volume}, ${magazine.month}, ${magazine.year}`,
            href: `/revista/${magazine.number}`,
          },
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

      <ArticleNav prev={prev} next={next} basePath={`/revista/${magazine.number}/artigo`} />
    </PageShell>
  );
}
