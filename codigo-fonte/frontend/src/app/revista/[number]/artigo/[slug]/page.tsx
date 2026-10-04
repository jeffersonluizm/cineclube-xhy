import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PaginaTexto from '@/components/PaginaTexto';
import { api, ouNulo } from '@/lib/api';
import { pageMetadata } from '@/lib/seo';

interface Props {
  params: { number: string; slug: string };
}

const carregar = (p: Props['params']) => ouNulo(api.revista.article(p.number, p.slug));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const dados = await carregar(params).catch(() => null);
  if (!dados) return { title: 'Texto' };
  const { article, magazine } = dados;
  return pageMetadata({
    title: article.title,
    description: article.epigraph || article.content,
    path: `/revista/${magazine.number}/artigo/${article.slug}`,
    image: article.coverImage || magazine.coverImage,
    type: 'article',
    authors: [article.author],
  });
}

export default async function ArticlePage({ params }: Props) {
  const dados = await carregar(params);
  if (!dados) notFound();
  const { article, magazine, prev, next } = dados;
  return (
    <PaginaTexto
      article={article}
      prev={prev}
      next={next}
      baseVizinhos={`/revista/${magazine.number}/artigo`}
      migalhas={[
        { label: 'revista xhy', href: '/revista' },
        { label: `n°${magazine.number}, v.${magazine.volume}, ${magazine.month}, ${magazine.year}`, href: `/revista/${magazine.number}` },
      ]}
    />
  );
}
