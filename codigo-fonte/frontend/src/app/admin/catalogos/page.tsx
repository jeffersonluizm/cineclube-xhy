'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminApi } from '@/lib/adminApi';
import type { Catalog } from '@/lib/types';

export default function AdminCatalogosPage() {
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.catalogos
      .list()
      .then(setCatalogs)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display font-black text-text-dark text-3xl">catálogos</h1>
        <Link
          href="/admin/catalogos/novo"
          className="bg-pink text-white font-display font-bold px-5 py-2 rounded hover:opacity-90 transition-opacity"
        >
          + novo catálogo
        </Link>
      </div>

      {loading && <p className="font-sans text-text-dark/60">carregando…</p>}
      {error && <p className="font-sans text-pink">{error}</p>}

      {!loading && !error && catalogs.length === 0 && (
        <p className="font-serif text-text-dark/70 text-lg">Nenhum catálogo ainda.</p>
      )}

      <div className="grid gap-4">
        {catalogs.map((cat) => (
          <Link
            key={cat._id}
            href={`/admin/catalogos/${cat._id}`}
            className="bg-white rounded-lg px-6 py-5 flex items-baseline gap-4 border border-text-dark/10 hover:border-olive transition-colors"
          >
            <span className="font-display font-black text-gold text-lg">{cat.year}</span>
            <span className="font-display font-bold text-text-dark text-xl">{cat.title}</span>
            <span className="ml-auto font-display text-sm text-blue-link">gerenciar →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
