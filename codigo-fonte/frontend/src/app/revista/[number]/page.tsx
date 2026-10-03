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
  params: { number: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { magazine } = await api.revista.get(params.number);
    return pageMetadata({
      title: `Revista XHY n°${magazine.number}`,
      description: magazine.editorial || `Revista XHY, v. ${magazine.volume}, n. ${magazine.number}, ${magazine.month}, ${magazine.year}.`,
      path: `/revista/${magazine.number}`,
      image: magazine.coverImage,
    });
  } catch {
    return { title: 'Revista' };
  }
}

export default async function RevistaNumberPage({ params }: Props) {
  let data;
  try {
    data = await api.revista.get(params.number);
  } catch {
    notFound();
  }

  const { magazine, columns } = data;
  const entries = Object.entries(columns);

  return (
    <PageShell>
      <Breadcrumb crumbs={[{ label: 'revista', href: '/revista' }, { label: `n°${magazine.number}` }]} />

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
        {/* Capa */}
        <div className="w-full max-w-[430px] shrink-0 self-start">
          {magazine.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl(magazine.coverImage)}
              alt={`Capa da revista n°${magazine.number}`}
              decoding="async"
              className="w-full object-cover"
              style={{ aspectRatio: '3/4' }}
            />
          ) : (
            <div className="w-full bg-dark-purple" style={{ aspectRatio: '3/4' }} />
          )}
        </div>

        {/* Sumário central */}
        <div className="flex-1 min-w-0">
          <h1
            className="font-display font-black text-text-dark mb-6 md:mb-8"
            style={{ fontSize: 'clamp(3rem, 10vw, 4.5rem)', lineHeight: 1 }}
          >
            n<sup className="font-black" style={{ fontSize: '0.55em' }}>o</sup>
            {magazine.number}
          </h1>

          {magazine.editorial && (
            <div className="mb-6">
              <p className="font-display font-bold text-text-dark text-sm mb-1">editorial</p>
              <p className="font-serif italic text-text-dark text-sm leading-snug opacity-80">
                {excerpt(magazine.editorial, 160)}
              </p>
            </div>
          )}

          {entries.map(([col, arts]) => (
            <section key={col} className="mb-6">
              <p className="font-display font-bold text-text-dark text-sm mb-2">{col}</p>
              {arts.map((art) => (
                <div key={art._id} className="mb-3">
                  <Link
                    href={`/revista/${magazine.number}/artigo/${art.slug}`}
                    className="font-serif italic text-text-dark text-base sm:text-sm block leading-snug hover:text-olive hover:underline"
                  >
                    {art.title}
                  </Link>
                  <p className="font-display font-bold text-text-dark text-xs">{art.author}</p>
                  {art.content && (
                    <p className="font-serif italic text-text-dark text-xs leading-snug opacity-70">
                      {excerpt(art.content)}
                    </p>
                  )}
                </div>
              ))}
            </section>
          ))}

          {entries.length === 0 && (
            <p className="font-serif italic text-text-dark">Esta edição ainda não tem textos publicados.</p>
          )}
        </div>

        {/* Sumário lateral direita — só em telas largas, onde há espaço para a repetição */}
        <aside className="hidden xl:block w-52 shrink-0" aria-label="sumário">
          {entries.map(([col, arts]) => (
            <div key={col} className="mb-6">
              <p className="font-display font-bold text-text-dark text-sm mb-2">{col}</p>
              {arts.map((art) => (
                <div key={art._id} className="mb-3">
                  <Link
                    href={`/revista/${magazine.number}/artigo/${art.slug}`}
                    className="font-serif italic text-text-dark text-sm block leading-snug hover:text-olive hover:underline"
                  >
                    {art.title}
                  </Link>
                  <p className="font-display font-bold text-text-dark text-xs">{art.author}</p>
                </div>
              ))}
            </div>
          ))}
        </aside>
      </div>
    </PageShell>
  );
}
