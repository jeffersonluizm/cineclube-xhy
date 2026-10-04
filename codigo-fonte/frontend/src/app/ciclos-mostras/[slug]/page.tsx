import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import PageShell from '@/components/PageShell';
import Breadcrumb from '@/components/Breadcrumb';
import { api } from '@/lib/api';
import { imageUrl } from '@/lib/media';
import { excerpt } from '@/lib/text';
import { pageMetadata } from '@/lib/seo';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { cycle } = await api.ciclos.get(params.slug);
    return pageMetadata({
      title: cycle.subtitle ? `${cycle.title}: ${cycle.subtitle}` : cycle.title,
      description: cycle.description || `${cycle.title} (${cycle.year}) — exibição do Cineclube XHY.`,
      path: `/ciclos-mostras/${cycle.slug}`,
      image: cycle.coverImage,
    });
  } catch {
    return { title: 'Exibição não encontrada' };
  }
}

export default async function CicloDetailPage({ params }: Props) {
  let data;
  try {
    data = await api.ciclos.get(params.slug);
  } catch {
    notFound();
  }

  const { cycle, films } = data;
  const textSections = Object.entries(data.sections ?? {});

  const filmsBySlug = Object.fromEntries(films.map((f) => [f.slug, f]));

  return (
    <PageShell>
      <Breadcrumb crumbs={[{ label: 'exibições', href: '/ciclos-mostras' }, { label: cycle.title.toLowerCase() }]} />

      <h1
        className="font-display font-black text-text-dark leading-none mb-2"
        style={{ fontSize: 'clamp(2.5rem, 9vw, 5.5rem)' }}
      >
        {cycle.title}
      </h1>

      {cycle.subtitle && (
        <p
          className="font-display italic text-text-dark mb-6 md:mb-8"
          style={{ fontSize: 'clamp(1.25rem, 4vw, 2.2rem)' }}
        >
          {cycle.subtitle}
        </p>
      )}

      {cycle.coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl(cycle.coverImage)}
          alt={cycle.title}
          decoding="async"
          className="w-full max-w-3xl max-h-[420px] object-cover mb-8"
        />
      )}

      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1 min-w-0 max-w-prose">
          {cycle.description && (
            <div className="mb-4">
              {cycle.description.split('\n').map((p, i) => (
                <p key={i} className="font-serif text-text-dark text-base md:text-lg leading-relaxed mb-3">{p}</p>
              ))}
            </div>
          )}

          {cycle.author && (
            <p className="font-serif italic text-pink text-base mb-8">
              por {cycle.author}
              {cycle.authorFootnote && <sup>1</sup>}
            </p>
          )}

          {cycle.screenings.length > 0 && (
            <section aria-labelledby="programacao">
              <p id="programacao" className="font-display font-black text-pink text-sm tracking-widest mb-6">
                PROGRAMAÇÃO
              </p>

              {cycle.screenings.map((s, i) => {
                const film = filmsBySlug[s.filmSlug];
                const isLinked = !!film;
                return (
                  <div key={i} className="mb-6">
                    <p className="font-serif text-text-dark text-sm mb-1">
                      {s.date} | {s.time}
                    </p>
                    {isLinked ? (
                      <Link
                        href={`/ciclos-mostras/${cycle.slug}/${s.filmSlug}`}
                        className="font-display font-bold text-text-dark text-base hover:text-olive block"
                      >
                        {s.filmTitle}
                      </Link>
                    ) : (
                      <p className="font-display font-bold text-text-dark text-base">{s.filmTitle}</p>
                    )}
                    <p className="font-serif text-blue-link text-sm">
                      {s.director}, {s.duration}, {s.country}
                    </p>
                  </div>
                );
              })}
            </section>
          )}

          {textSections.length > 0 && (
            <section aria-labelledby="textos" className="mt-10">
              <p id="textos" className="font-display font-black text-pink text-sm tracking-widest mb-6">
                TEXTOS
              </p>

              {textSections.map(([section, arts]) => (
                <div key={section} className="mb-8">
                  <p className="font-display font-bold text-text-dark text-sm mb-3">{section}</p>
                  {arts.map((art) => (
                    <div key={art._id} className="mb-4">
                      <Link
                        href={`/ciclos-mostras/${cycle.slug}/texto/${art.slug}`}
                        className="font-serif italic text-text-dark text-base sm:text-sm block hover:text-olive hover:underline leading-snug"
                      >
                        {art.title}
                      </Link>
                      <p className="font-display font-bold text-text-dark text-xs">{art.author}</p>
                      {art.content && (
                        <p className="font-serif italic text-text-dark text-xs opacity-70 leading-snug">
                          {excerpt(art.content)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </section>
          )}
        </div>

        {cycle.epigraph && (
          <aside className="md:w-48 shrink-0 border-t border-text-dark/10 pt-6 md:border-0 md:pt-0">
            <p className="font-serif italic text-light-text text-xs leading-relaxed">{cycle.epigraph}</p>
          </aside>
        )}
      </div>
    </PageShell>
  );
}
