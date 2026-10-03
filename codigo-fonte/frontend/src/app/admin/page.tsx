'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminApi } from '@/lib/adminApi';
import type { Magazine } from '@/lib/types';

export default function AdminDashboard() {
  const [magazines, setMagazines] = useState<Magazine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.revistas
      .list()
      .then(setMagazines)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display font-black text-text-dark text-3xl">revistas</h1>
        <Link
          href="/admin/revistas/nova"
          className="bg-pink text-white font-display font-bold px-5 py-2 rounded hover:opacity-90 transition-opacity"
        >
          + nova revista
        </Link>
      </div>

      {loading && <p className="font-sans text-text-dark/60">carregando…</p>}
      {error && <p className="font-sans text-pink">{error}</p>}

      {!loading && !error && magazines.length === 0 && (
        <p className="font-serif text-text-dark/70 text-lg">
          Nenhuma revista ainda. Crie a primeira edição para começar a publicar.
        </p>
      )}

      <div className="grid gap-4">
        {magazines.map((mag) => (
          <Link
            key={mag._id}
            href={`/admin/revistas/${mag._id}`}
            className="bg-white rounded-lg px-6 py-5 flex items-baseline gap-4 border border-text-dark/10 hover:border-olive transition-colors"
          >
            <span className="font-display font-black text-pink text-2xl">n°{mag.number}</span>
            <span className="font-serif text-text-dark text-lg">
              v.{mag.volume}, {mag.month}, {mag.year}
            </span>
            <span className="ml-auto font-display text-sm text-blue-link">gerenciar →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
