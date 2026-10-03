'use client';

import { useParams, useRouter } from 'next/navigation';
import FilmForm from '@/components/admin/FilmForm';
import { adminApi, FilmInput } from '@/lib/adminApi';

export default function NovoFilmePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  async function handleSave(data: FilmInput) {
    await adminApi.filmes.create(data);
    router.replace(`/admin/ciclos/${id}`);
  }

  return (
    <div>
      <h1 className="font-display font-black text-text-dark text-3xl mb-8">novo filme</h1>
      <FilmForm cycleId={id} onSave={handleSave} />
    </div>
  );
}
