'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import FilmForm from '@/components/admin/FilmForm';
import { useCarregar } from '@/components/admin/hooks';
import { useToast } from '@/components/admin/Toasts';
import { CabecalhoPagina, EstadoCarregando, EstadoErro } from '@/components/admin/ui';
import { adminApi, FilmInput } from '@/lib/adminApi';

export default function EditarFilmePage() {
  const { id } = useParams<{ id: string }>();
  const avisar = useToast();
  const { dados: film, setDados, erro, recarregar } = useCarregar(() => adminApi.filmes.get(id), [id]);

  if (erro) return <EstadoErro mensagem={erro} tentarDeNovo={recarregar} />;
  if (!film) return <EstadoCarregando />;

  async function salvar(data: FilmInput) {
    setDados(await adminApi.filmes.update(id, data));
    avisar('Página do filme salva.');
  }

  return (
    <div>
      <CabecalhoPagina
        sobretitulo="editar filme"
        titulo={film.title}
        acoes={
          <Link href={`/admin/ciclos/${film.cycleId}`} className="font-display text-azul-escuro hover:underline">
            ← voltar para a exibição
          </Link>
        }
      />
      <FilmForm key={film._id} cycleId={film.cycleId} initial={film} onSave={salvar} />
    </div>
  );
}
