import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PageShell from '@/components/PageShell';
import Breadcrumb from '@/components/Breadcrumb';
import ArticleNav from '@/components/ArticleNav';
import { api } from '@/lib/api';
import { imageUrl } from '@/lib/media';
import { pageMetadata } from '@/lib/seo';

interface Props {
  params: { slug: string; filmSlug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { film, cycle } = await api.ciclos.film(params.slug, params.filmSlug);
    return pageMetadata({
      title: `${film.title} (${film.year})`,
      description: film.synopsis,
      path: `/ciclos-mostras/${cycle.slug}/${film.slug}`,
      image: film.image || cycle.coverImage,
      type: 'article',
      authors: film.author ? [film.author] : undefined,
    });
  } catch {
    return { title: 'Filme não encontrado' };
  }
}

export default async function FilmPage({ params }: Props) {
  let data;
  try {
    data = await api.ciclos.film(params.slug, params.filmSlug);
  } catch {
    notFound();
  }

  const { film, cycle, prev, next } = data;

  return (
    <PageShell tone="dark">
      <Breadcrumb
        crumbs={[
          { label: 'exibições', href: '/ciclos-mostras' },
          { label: cycle.title.toLowerCase(), href: `/ciclos-mostras/${cycle.slug}` },
          { label: `${film.title.toLowerCase()} (${film.year})` },
        ]}
      />

      <article>
        <h1
          className="font-display font-black text-cream leading-none mb-3"
          style={{ fontSize: 'clamp(2.5rem, 9vw, 5.5rem)' }}
        >
          {film.title}
        </h1>

        <div className="mb-6">
          <p className="font-serif italic text-blue-link text-lg">
            {film.director} ({film.year})
          </p>
          <p className="font-serif italic text-blue-link text-base">{film.duration}</p>
          <p className="font-serif italic text-blue-link text-base">{film.country}</p>
        </div>

        {film.image ? (
          <div className="mb-6 w-full max-w-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl(film.image)}
              alt={film.title}
              decoding="async"
              className="w-full max-h-[480px] object-cover"
            />
          </div>
        ) : (
          <div className="mb-6 w-full max-w-2xl h-48 sm:h-80 bg-text-dark opacity-60" aria-hidden="true" />
        )}

        <p className="font-display font-bold text-cream text-base leading-relaxed mb-8 max-w-2xl">{film.synopsis}</p>

        {film.content && (
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1 min-w-0 max-w-2xl">
              {film.content.split('\n').map((p, i) => (
                <p key={i} className="font-serif text-cream text-base md:text-lg leading-relaxed mb-4">
                  {p}
                </p>
              ))}
            </div>

            {film.footnotes && film.footnotes.length > 0 && (
              <aside
                aria-label="notas"
                className="md:w-48 shrink-0 border-t border-light-text/30 pt-6 md:border-0 md:pt-0"
              >
                {film.footnotes.map((note, i) => (
                  <p key={i} className="font-serif text-light-text text-xs leading-relaxed mb-4">
                    {note}
                  </p>
                ))}
              </aside>
            )}
          </div>
        )}

        {film.author && (
          <p className="font-serif italic text-pink text-base mt-6">
            por {film.author}
            {film.authorFootnote && <sup>1</sup>}
          </p>
        )}
      </article>

      <ArticleNav
        prev={prev ? { title: prev.title, slug: prev.slug, author: prev.director } : null}
        next={next ? { title: next.title, slug: next.slug, author: next.director } : null}
        basePath={`/ciclos-mostras/${cycle.slug}`}
      />
    </PageShell>
  );
}
