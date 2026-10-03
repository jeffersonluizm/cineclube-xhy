'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminApi } from '@/lib/adminApi';
import type { Cycle } from '@/lib/types';

export default function AdminCiclosPage() {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.ciclos
      .list()
      .then(setCycles)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display font-black text-text-dark text-3xl">exibições</h1>
        <Link
          href="/admin/ciclos/novo"
          className="bg-pink text-white font-display font-bold px-5 py-2 rounded hover:opacity-90 transition-opacity"
        >
          + nova exibição
        </Link>
      </div>

      {loading && <p className="font-sans text-text-dark/60">carregando…</p>}
      {error && <p className="font-sans text-pink">{error}</p>}

      {!loading && !error && cycles.length === 0 && (
        <p className="font-serif text-text-dark/70 text-lg">Nenhuma exibição ainda.</p>
      )}

      <div className="grid gap-4">
        {cycles.map((cycle) => (
          <Link
            key={cycle._id}
            href={`/admin/ciclos/${cycle._id}`}
            className="bg-white rounded-lg px-6 py-5 flex items-baseline gap-4 border border-text-dark/10 hover:border-olive transition-colors"
          >
            <span className="font-display font-black text-gold text-lg">{cycle.year}</span>
            <span className="font-display font-bold text-text-dark text-xl">{cycle.title}</span>
            {cycle.subtitle && <span className="font-serif italic text-text-dark/60 text-sm">{cycle.subtitle}</span>}
            <span className="ml-auto font-display text-sm text-blue-link">gerenciar →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
