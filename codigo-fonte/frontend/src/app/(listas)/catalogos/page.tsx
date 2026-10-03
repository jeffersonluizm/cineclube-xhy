import type { Metadata } from 'next';
import Link from 'next/link';
import PageShell from '@/components/PageShell';
import Breadcrumb from '@/components/Breadcrumb';
import { api } from '@/lib/api';
import { Catalog } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Catálogos',
  description: 'Catálogos publicados pelo Cineclube XHY, por ano.',
  alternates: { canonical: '/catalogos' },
};

export default async function CatalogosPage() {
  let catalogs: Catalog[] = [];
  try {
    catalogs = await api.catalogos.list();
  } catch {
    // sem dados
  }

  const byYear: Record<number, Catalog[]> = {};
  for (const cat of catalogs) {
    if (!byYear[cat.year]) byYear[cat.year] = [];
    byYear[cat.year].push(cat);
  }
  const years = Object.keys(byYear)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <PageShell>
      <Breadcrumb crumbs={[{ label: 'catálogos' }]} />

      {years.map((year) => (
        <section key={year} className="mb-12">
          <p className="font-display font-bold text-gold text-xl mb-2">{year}</p>
          {byYear[year].map((cat) => (
            <Link
              key={cat._id}
              href={`/catalogos/${cat.slug}`}
              className="block font-display font-black text-text-dark hover:text-olive hover:underline transition-colors leading-tight mb-2"
              style={{ fontSize: 'clamp(2rem, 7vw, 4.5rem)' }}
            >
              {cat.title}
            </Link>
          ))}
        </section>
      ))}

      {catalogs.length === 0 && (
        <p className="font-serif italic text-text-dark">Nenhum catálogo disponível.</p>
      )}
    </PageShell>
  );
}
