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
    const { catalog } = await api.catalogos.get(params.slug);
    return pageMetadata({
      title: catalog.title,
      description: catalog.description || `Catálogo ${catalog.title} (${catalog.year}) do Cineclube XHY.`,
      path: `/catalogos/${catalog.slug}`,
      image: catalog.coverImage,
    });
  } catch {
    return { title: 'Catálogo não encontrado' };
  }
}

export default async function CatalogoDetailPage({ params }: Props) {
  let data;
  try {
    data = await api.catalogos.get(params.slug);
  } catch {
    notFound();
  }

  const { catalog, sections } = data;
  const entries = Object.entries(sections);

  return (
    <PageShell>
      <Breadcrumb crumbs={[{ label: 'catálogos', href: '/catalogos' }, { label: catalog.title }]} />

      <h1 className="sr-only">{catalog.title}</h1>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
        {/* Capa */}
        <div className="w-full max-w-[490px] shrink-0 self-start">
          {catalog.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl(catalog.coverImage)}
              alt={`Capa do catálogo ${catalog.title}`}
              decoding="async"
              className="w-full object-cover"
              style={{ aspectRatio: '3/4' }}
            />
          ) : (
            <div className="w-full bg-dark-purple" style={{ aspectRatio: '3/4' }} />
          )}
        </div>

        {/* Seções */}
        <div className="flex-1 min-w-0">
          {catalog.description && (
            <p className="font-serif text-text-dark text-base sm:text-sm leading-relaxed mb-8 max-w-md">
              {catalog.description}
            </p>
          )}

          {entries.map(([section, arts]) => (
            <section key={section} className="mb-8">
              <p className="font-display font-bold text-text-dark text-sm mb-3">{section}</p>
              {arts.map((art) => (
                <div key={art._id} className="mb-4">
                  <Link
                    href={`/catalogos/${catalog.slug}/${art.slug}`}
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
            </section>
          ))}

          {entries.length === 0 && (
            <p className="font-serif italic text-text-dark">Este catálogo ainda não tem textos publicados.</p>
          )}
        </div>
      </div>
    </PageShell>
  );
}
