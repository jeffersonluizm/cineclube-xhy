import type { Metadata } from 'next';
import Link from 'next/link';
import PageShell from '@/components/PageShell';
import Breadcrumb from '@/components/Breadcrumb';
import { api } from '@/lib/api';
import { Cycle } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Exibições',
  description: 'Ciclos e mostras de cinema realizados pelo Cineclube XHY, por ano.',
  alternates: { canonical: '/ciclos-mostras' },
};

export default async function CiclosMostrasPage() {
  let cycles: Cycle[] = [];
  try {
    cycles = await api.ciclos.list();
  } catch {
    // sem dados
  }

  const byYear: Record<number, Cycle[]> = {};
  for (const cycle of cycles) {
    if (!byYear[cycle.year]) byYear[cycle.year] = [];
    byYear[cycle.year].push(cycle);
  }
  const years = Object.keys(byYear)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <PageShell>
      <Breadcrumb crumbs={[{ label: 'exibições' }]} />

      {years.map((year) => (
        <section key={year} className="mb-12">
          <p className="font-display font-bold text-gold text-xl mb-2">{year}</p>
          {byYear[year].map((cycle) => (
            <Link
              key={cycle._id}
              href={`/ciclos-mostras/${cycle.slug}`}
              className="block font-display font-black text-text-dark hover:text-olive hover:underline transition-colors leading-tight mb-2"
              style={{ fontSize: 'clamp(2rem, 7vw, 4.5rem)' }}
            >
              {cycle.title}
            </Link>
          ))}
        </section>
      ))}

      {cycles.length === 0 && (
        <p className="font-serif italic text-text-dark">Nenhuma exibição disponível.</p>
      )}
    </PageShell>
  );
}
