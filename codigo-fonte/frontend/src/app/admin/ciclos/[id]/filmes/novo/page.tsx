'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import FilmForm from '@/components/admin/FilmForm';
import { useToast } from '@/components/admin/Toasts';
import { CabecalhoPagina } from '@/components/admin/ui';
import { adminApi, FilmInput } from '@/lib/adminApi';

export default function NovoFilmePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const avisar = useToast();

  async function salvar(data: FilmInput) {
    await adminApi.filmes.create(data);
    avisar('Página do filme criada. Ligue-a a uma sessão na programação.');
    router.replace(`/admin/ciclos/${id}`);
  }

  return (
    <div>
      <CabecalhoPagina
        titulo="novo filme"
        acoes={
          <Link href={`/admin/ciclos/${id}`} className="font-display text-azul-escuro hover:underline">
            cancelar
          </Link>
        }
      />
      <FilmForm cycleId={id} onSave={salvar} />
    </div>
  );
}
