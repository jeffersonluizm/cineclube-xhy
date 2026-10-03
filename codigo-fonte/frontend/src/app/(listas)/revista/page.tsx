import type { Metadata } from 'next';
import Link from 'next/link';
import PageShell from '@/components/PageShell';
import Breadcrumb from '@/components/Breadcrumb';
import { api } from '@/lib/api';
import type { Magazine } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Revista',
  description: 'Todas as edições da Revista XHY, por ano.',
  alternates: { canonical: '/revista' },
};

export default async function RevistaPage() {
  let magazines: Magazine[] = [];
  try {
    magazines = await api.revista.list();
  } catch {
    // API fora do ar — mostra o aviso abaixo
  }

  const byYear: Record<number, Magazine[]> = {};
  for (const mag of magazines) {
    if (!byYear[mag.year]) byYear[mag.year] = [];
    byYear[mag.year].push(mag);
  }
  const years = Object.keys(byYear)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <PageShell>
      <Breadcrumb crumbs={[{ label: 'revista xhy' }]} />

      {years.map((year) => (
        <section key={year} className="mb-12">
          <p className="font-display font-bold text-gold text-xl mb-2">{year}</p>
          {byYear[year].map((mag) => (
            <Link key={mag._id} href={`/revista/${mag.number}`} className="group block mb-6">
              <span
                className="font-display font-black text-text-dark group-hover:text-olive group-hover:underline transition-colors leading-tight block"
                style={{ fontSize: 'clamp(2.5rem, 8vw, 4.5rem)' }}
              >
                n°{mag.number}
              </span>
              <span className="font-serif italic text-text-dark text-base group-hover:text-olive transition-colors">
                v.{mag.volume}, {mag.month}, {mag.year}
              </span>
            </Link>
          ))}
        </section>
      ))}

      {magazines.length === 0 && (
        <p className="font-serif italic text-text-dark">Nenhuma revista disponível.</p>
      )}
    </PageShell>
  );
}
