import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PaginaTexto from '@/components/PaginaTexto';
import { api, ouNulo } from '@/lib/api';
import { pageMetadata } from '@/lib/seo';

interface Props {
  params: { slug: string; textSlug: string };
}

const carregar = (p: Props['params']) => ouNulo(api.catalogos.text(p.slug, p.textSlug));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const dados = await carregar(params).catch(() => null);
  if (!dados) return { title: 'Texto' };
  const { article, catalog } = dados;
  return pageMetadata({
    title: `${article.title} · ${catalog.title}`,
    description: article.epigraph || article.content,
    path: `/catalogos/${catalog.slug}/${article.slug}`,
    image: article.coverImage || catalog.coverImage,
    type: 'article',
    authors: [article.author],
  });
}

export default async function CatalogoTextPage({ params }: Props) {
  const dados = await carregar(params);
  if (!dados) notFound();
  const { article, catalog, prev, next } = dados;
  return (
    <PaginaTexto
      article={article}
      prev={prev}
      next={next}
      baseVizinhos={`/catalogos/${catalog.slug}`}
      migalhas={[
        { label: 'catálogos', href: '/catalogos' },
        { label: catalog.title, href: `/catalogos/${catalog.slug}` },
      ]}
    />
  );
}
