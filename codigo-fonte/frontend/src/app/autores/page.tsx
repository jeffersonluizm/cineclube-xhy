import type { Metadata } from 'next';
import Link from 'next/link';
import PageShell from '@/components/PageShell';
import Breadcrumb from '@/components/Breadcrumb';
import { api } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Autores',
  description: 'Quem escreve na revista, nos catálogos e nas exibições do Cineclube XHY.',
  alternates: { canonical: '/autores' },
};

export default async function AutoresPage() {
  const autores = await api.autores();
  return (
    <PageShell>
      <Breadcrumb crumbs={[{ label: 'autores' }]} />
      <h1 className="font-display font-black text-text-dark text-titulo-lista mb-8">autores</h1>
      {autores.length === 0 ? (
        <p className="font-serif italic text-text-dark">Nenhum texto publicado ainda.</p>
      ) : (
        <ul className="columns-1 sm:columns-2 lg:columns-3 gap-10">
          {autores.map((a) => (
            <li key={a.slug} className="mb-3 break-inside-avoid">
              <Link href={`/autores/${a.slug}`} className="font-serif italic text-text-dark text-xl hover:text-olive-escuro hover:underline">
                {a.nome}
              </Link>{' '}
              <span className="font-sans text-xs text-text-suave">
                {a.textos} {a.textos === 1 ? 'texto' : 'textos'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
