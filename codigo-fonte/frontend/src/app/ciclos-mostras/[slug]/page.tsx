import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import PageShell from '@/components/PageShell';
import Breadcrumb from '@/components/Breadcrumb';
import SumarioSecoes from '@/components/SumarioSecoes';
import Notas, { ChamadaNota } from '@/components/Notas';
import { api, ouNulo } from '@/lib/api';
import { imageUrl } from '@/lib/media';
import { exibicaoVazia, filmeDaSessao } from '@/lib/conteudo';
import { pageMetadata } from '@/lib/seo';

interface Props {
  params: { slug: string };
}

const carregar = (slug: string) => ouNulo(api.ciclos.get(slug));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const dados = await carregar(params.slug).catch(() => null);
  if (!dados) return { title: 'Página não encontrada', robots: { index: false } };
  const { cycle } = dados;
  return pageMetadata({
    title: cycle.subtitle ? `${cycle.title}: ${cycle.subtitle}` : cycle.title,
    description: cycle.description || `${cycle.title} (${cycle.year}), exibição do Cineclube XHY.`,
    path: `/ciclos-mostras/${cycle.slug}`,
    image: cycle.coverImage,
  });
}

export default async function CicloDetailPage({ params }: Props) {
  const dados = await carregar(params.slug);
  if (!dados) notFound();
  const { cycle, films, sections } = dados;

  // A nota do autor (se houver) é a 1; as notas do ciclo vêm depois
  const notas = [...(cycle.authorFootnote ? [cycle.authorFootnote] : []), ...(cycle.footnotes ?? [])].filter((n) => n.trim());

  return (
    <PageShell>
      <Breadcrumb crumbs={[{ label: 'exibições', href: '/ciclos-mostras' }, { label: cycle.title.toLowerCase() }]} />

      <h1 className="font-display font-black text-text-dark text-titulo-pagina mb-2">{cycle.title}</h1>

      {cycle.subtitle && <p className="font-display italic text-text-dark text-subtitulo mb-6 md:mb-8">{cycle.subtitle}</p>}

      {cycle.coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl(cycle.coverImage)} alt="" decoding="async" className="w-full max-w-3xl max-h-[420px] object-cover mb-8" />
      )}

      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1 min-w-0 max-w-prose">
          {cycle.description && (
            <div className="mb-4">
              {cycle.description.split('\n').map((p, i) => (
                <p key={i} className="font-serif text-text-dark text-base md:text-lg leading-relaxed mb-3">
                  {p}
                </p>
              ))}
            </div>
          )}

          {cycle.author && (
            <p className="font-serif italic text-pink-escuro text-base mb-8">
              por {cycle.author}
              {cycle.authorFootnote && <ChamadaNota n={1} />}
            </p>
          )}

          {exibicaoVazia(cycle, films, sections) && (
            <div role="status" className="border-l-4 border-gold pl-5 py-2 mb-8 max-w-prose">
              <p className="font-display font-bold text-text-dark text-base mb-1">Programação em preparação</p>
              <p className="font-serif text-text-dark text-base leading-relaxed">
                Esta exibição já foi anunciada, mas as sessões, os filmes e os textos ainda não foram publicados. Volte em breve ou{' '}
                <Link href="/ciclos-mostras" className="text-azul-escuro underline underline-offset-4">
                  veja as outras exibições
                </Link>
                .
              </p>
            </div>
          )}

          {(cycle.screenings ?? []).length > 0 && (
            <section aria-labelledby="programacao">
              <h2 id="programacao" className="font-display font-black text-pink-escuro text-sm tracking-widest mb-6">
                PROGRAMAÇÃO
              </h2>

              <ol>
                {(cycle.screenings ?? []).map((s, i) => {
                  const filme = filmeDaSessao(s, films);
                  const ficha = [s.director, s.duration, s.country].filter(Boolean).join(', ');
                  return (
                    <li key={i} className="mb-6">
                      <p className="font-serif text-text-dark text-sm mb-1">
                        {s.date} | {s.time}
                      </p>
                      {filme ? (
                        <Link
                          href={`/ciclos-mostras/${cycle.slug}/${filme.slug}`}
                          className="font-display font-bold text-text-dark text-base underline decoration-text-dark/30 underline-offset-4 hover:text-olive-escuro hover:decoration-current block"
                        >
                          {s.filmTitle}
                        </Link>
                      ) : (
                        <p className="font-display font-bold text-text-dark text-base">{s.filmTitle}</p>
                      )}
                      {ficha && <p className="font-serif text-azul-escuro text-sm">{ficha}</p>}
                    </li>
                  );
                })}
              </ol>
            </section>
          )}

          {Object.keys(sections ?? {}).length > 0 && (
            <section aria-labelledby="textos" className="mt-10">
              <h2 id="textos" className="font-display font-black text-pink-escuro text-sm tracking-widest mb-6">
                TEXTOS
              </h2>
              <SumarioSecoes secoes={sections} hrefTexto={(t) => `/ciclos-mostras/${cycle.slug}/texto/${t.slug}`} nivelTitulo="h3" />
            </section>
          )}
        </div>

        {(cycle.epigraph || notas.length > 0) && (
          <div className="md:w-48 shrink-0 flex flex-col gap-8">
            {cycle.epigraph && (
              <aside aria-label="epígrafe" className="border-t border-text-dark/10 pt-6 md:border-0 md:pt-0">
                <p className="font-serif italic text-light-escuro text-sm leading-relaxed">{cycle.epigraph}</p>
              </aside>
            )}
            <Notas notas={notas} tom="cream" chamadas={cycle.author && cycle.authorFootnote ? [1] : []} />
          </div>
        )}
      </div>
    </PageShell>
  );
}
