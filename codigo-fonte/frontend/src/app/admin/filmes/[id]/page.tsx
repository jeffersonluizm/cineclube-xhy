'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import FilmForm from '@/components/admin/FilmForm';
import { adminApi, FilmInput } from '@/lib/adminApi';
import type { Film } from '@/lib/types';

export default function EditarFilmePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [film, setFilm] = useState<Film | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.filmes
      .get(id)
      .then(setFilm)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar'));
  }, [id]);

  async function handleSave(data: FilmInput) {
    await adminApi.filmes.update(id, data);
    if (film) router.replace(`/admin/ciclos/${film.cycleId}`);
  }

  if (error) return <p className="font-sans text-pink">{error}</p>;
  if (!film) return <p className="font-sans text-text-dark/60">carregando…</p>;

  return (
    <div>
      <h1 className="font-display font-black text-text-dark text-3xl mb-8">editar filme</h1>
      <FilmForm cycleId={film.cycleId} initial={film} onSave={handleSave} />
    </div>
  );
}
