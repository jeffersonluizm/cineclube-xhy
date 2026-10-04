import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PaginaTexto from '@/components/PaginaTexto';
import { api, ouNulo } from '@/lib/api';
import { pageMetadata } from '@/lib/seo';

interface Props {
  params: { slug: string; textSlug: string };
}

const carregar = (p: Props['params']) => ouNulo(api.ciclos.text(p.slug, p.textSlug));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const dados = await carregar(params).catch(() => null);
  if (!dados) return { title: 'Texto' };
  const { article, cycle } = dados;
  return pageMetadata({
    title: `${article.title} · ${cycle.title}`,
    description: article.epigraph || article.content,
    path: `/ciclos-mostras/${cycle.slug}/texto/${article.slug}`,
    image: article.coverImage || cycle.coverImage,
    type: 'article',
    authors: [article.author],
  });
}

export default async function CicloTextPage({ params }: Props) {
  const dados = await carregar(params);
  if (!dados) notFound();
  const { article, cycle, prev, next } = dados;
  return (
    <PaginaTexto
      article={article}
      prev={prev}
      next={next}
      baseVizinhos={`/ciclos-mostras/${cycle.slug}/texto`}
      migalhas={[
        { label: 'exibições', href: '/ciclos-mostras' },
        { label: cycle.title.toLowerCase(), href: `/ciclos-mostras/${cycle.slug}` },
      ]}
    />
  );
}
