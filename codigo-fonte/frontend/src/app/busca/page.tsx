import type { Metadata } from 'next';
import Link from 'next/link';
import PageShell from '@/components/PageShell';
import Breadcrumb from '@/components/Breadcrumb';
import ListaDeTextos from '@/components/ListaDeTextos';
import { api } from '@/lib/api';

interface Props {
  searchParams: { q?: string };
}

export function generateMetadata({ searchParams }: Props): Metadata {
  const termo = (searchParams.q ?? '').trim();
  return {
    title: termo ? `Busca: ${termo}` : 'Busca',
    description: 'Busque textos da revista, dos catálogos e das exibições, filmes e autores.',
    // resultados de busca não entram no índice dos buscadores
    robots: { index: false, follow: true },
  };
}

export default async function BuscaPage({ searchParams }: Props) {
  const termo = (searchParams.q ?? '').trim().slice(0, 100);
  const curto = termo.length > 0 && termo.length < 2;
  const resultado = termo.length >= 2 ? await api.busca(termo) : null;
  const autores = resultado ? null : await api.autores();
  const total = resultado ? resultado.textos.length + resultado.filmes.length : 0;

  return (
    <PageShell mainClassName="max-w-4xl">
      <Breadcrumb crumbs={[{ label: 'busca' }]} />
      <h1 className="font-display font-black text-text-dark text-titulo-lista mb-6">busca</h1>

      <form action="/busca" role="search" className="flex flex-wrap gap-3 mb-4 max-w-2xl">
        <label htmlFor="campo-busca" className="sr-only">
          O que você procura?
        </label>
        <input
          id="campo-busca"
          name="q"
          type="search"
          defaultValue={termo}
          minLength={2}
          maxLength={100}
          placeholder="um cineasta, um filme, um tema, um autor"
          aria-describedby="dica-busca"
          className="flex-1 min-w-[14rem] bg-papel text-text-dark px-4 py-3 font-sans text-base border border-text-dark/60 focus:border-text-dark"
        />
        <button type="submit" className="font-display font-bold bg-text-dark text-cream px-6 py-3 hover:bg-dark-purple">
          buscar
        </button>
      </form>
      <p id="dica-busca" className="font-serif italic text-text-suave text-sm mb-10">
        A busca ignora acentos e procura no título, no autor e no corpo dos textos publicados.
      </p>

      {curto && (
        <p role="status" className="font-serif text-pink-escuro mb-8">
          Digite ao menos 2 letras.
        </p>
      )}

      {resultado && (
        <div role="status" aria-live="polite">
          <p className="font-serif text-text-dark text-lg mb-8">
            {total === 0 ? (
              <>Nada encontrado para &ldquo;{resultado.termo}&rdquo;. Tente outra grafia ou um termo mais curto.</>
            ) : (
              <>
                {total} {total === 1 ? 'resultado' : 'resultados'} para &ldquo;{resultado.termo}&rdquo;
              </>
            )}
          </p>

          {resultado.textos.length > 0 && (
            <section aria-labelledby="res-textos" className="mb-12">
              <h2 id="res-textos" className="font-display font-black text-pink-escuro text-sm tracking-widest mb-6">
                TEXTOS
              </h2>
              <ListaDeTextos textos={resultado.textos} />
            </section>
          )}

          {resultado.filmes.length > 0 && (
            <section aria-labelledby="res-filmes">
              <h2 id="res-filmes" className="font-display font-black text-pink-escuro text-sm tracking-widest mb-6">
                FILMES EXIBIDOS
              </h2>
              <ul className="flex flex-col gap-3">
                {resultado.filmes.map((f) => (
                  <li key={f._id}>
                    <Link href={f.href} className="font-display font-bold text-text-dark text-lg hover:text-olive-escuro hover:underline">
                      {f.title}
                    </Link>{' '}
                    <span className="font-serif italic text-azul-escuro">
                      {f.director} ({f.year})
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {autores && autores.length > 0 && (
        <section aria-labelledby="autores-busca">
          <h2 id="autores-busca" className="font-display font-black text-pink-escuro text-sm tracking-widest mb-4">
            OU COMECE POR UM AUTOR
          </h2>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {autores.map((a) => (
              <li key={a.slug}>
                <Link href={`/autores/${a.slug}`} className="font-serif italic text-text-dark text-lg hover:text-olive-escuro hover:underline">
                  {a.nome}
                </Link>{' '}
                <span className="font-sans text-xs text-text-suave">({a.textos})</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </PageShell>
  );
}
