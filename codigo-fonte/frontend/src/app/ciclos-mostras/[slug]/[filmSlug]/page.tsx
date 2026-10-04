import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PageShell from '@/components/PageShell';
import Breadcrumb from '@/components/Breadcrumb';
import ArticleNav from '@/components/ArticleNav';
import Notas, { ChamadaNota } from '@/components/Notas';
import { api, ouNulo } from '@/lib/api';
import { imageUrl } from '@/lib/media';
import { pageMetadata } from '@/lib/seo';

interface Props {
  params: { slug: string; filmSlug: string };
}

const carregar = (p: Props['params']) => ouNulo(api.ciclos.film(p.slug, p.filmSlug));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const dados = await carregar(params).catch(() => null);
  if (!dados) return { title: 'Página não encontrada', robots: { index: false } };
  const { film, cycle } = dados;
  return pageMetadata({
    title: `${film.title} (${film.year})`,
    description: film.synopsis,
    path: `/ciclos-mostras/${cycle.slug}/${film.slug}`,
    image: film.image || cycle.coverImage,
    type: 'article',
    authors: film.author ? [film.author] : undefined,
  });
}

export default async function FilmPage({ params }: Props) {
  const dados = await carregar(params);
  if (!dados) notFound();
  const { film, cycle, prev, next } = dados;
  const notas = [...(film.authorFootnote ? [film.authorFootnote] : []), ...(film.footnotes ?? [])].filter((n) => n.trim());

  return (
    <PageShell tone="dark">
      <Breadcrumb
        tom="dark"
        crumbs={[
          { label: 'exibições', href: '/ciclos-mostras' },
          { label: cycle.title.toLowerCase(), href: `/ciclos-mostras/${cycle.slug}` },
          { label: `${film.title.toLowerCase()} (${film.year})` },
        ]}
      />

      <article>
        <h1 className="font-display font-black text-cream text-titulo-pagina mb-3">{film.title}</h1>

        <dl className="mb-6 font-serif italic text-azul-claro">
          <dt className="sr-only">direção e ano</dt>
          <dd className="text-lg">
            {film.director} ({film.year})
          </dd>
          <dt className="sr-only">duração</dt>
          <dd className="text-base">{film.duration}</dd>
          <dt className="sr-only">país</dt>
          <dd className="text-base">{film.country}</dd>
        </dl>

        {film.image ? (
          <div className="mb-6 w-full max-w-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl(film.image)} alt={`Fotograma de ${film.title}`} decoding="async" className="w-full max-h-[480px] object-cover" />
          </div>
        ) : (
          <div className="mb-6 w-full max-w-2xl h-48 sm:h-80 bg-text-dark opacity-60" aria-hidden="true" />
        )}

        {film.epigraph && <p className="font-serif italic text-gold text-base leading-relaxed mb-6 max-w-2xl md:ml-[30%] md:text-right">{film.epigraph}</p>}

        <p className="font-display font-bold text-cream text-base leading-relaxed mb-8 max-w-2xl">{film.synopsis}</p>

        {(film.content || film.author || notas.length > 0) && (
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1 min-w-0 max-w-2xl">
              {(film.content ?? '').split('\n').filter((p) => p.trim()).map((p, i) => (
                <p key={i} className="font-serif text-cream text-base md:text-lg leading-relaxed mb-4">
                  {p}
                </p>
              ))}
              {film.author && (
                <p className="font-serif italic text-pink-claro text-base mt-6">
                  por {film.author}
                  {film.authorFootnote && <ChamadaNota n={1} />}
                </p>
              )}
            </div>
            <Notas notas={notas} />
          </div>
        )}
      </article>

      <ArticleNav prev={prev} next={next} basePath={`/ciclos-mostras/${cycle.slug}`} item="filme" />
    </PageShell>
  );
}
