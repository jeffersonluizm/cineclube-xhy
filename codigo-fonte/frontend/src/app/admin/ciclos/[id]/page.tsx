'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import CycleForm from '@/components/admin/CycleForm';
import { adminApi, CycleInput } from '@/lib/adminApi';
import type { Cycle, Film } from '@/lib/types';

export default function CicloAdminPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [cycle, setCycle] = useState<Cycle | null>(null);
  const [films, setFilms] = useState<Film[]>([]);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    try {
      const [cycles, cycleFilms] = await Promise.all([adminApi.ciclos.list(), adminApi.filmes.list(id)]);
      const found = cycles.find((c) => c._id === id);
      if (!found) throw new Error('Ciclo não encontrado');
      setCycle(found);
      setFilms(cycleFilms);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar');
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSaveCycle(data: CycleInput) {
    await adminApi.ciclos.update(id, data);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function move(index: number, dir: -1 | 1) {
    const next = [...films];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setFilms(next);
    await adminApi.filmes.reorder(next.map((f) => f._id));
  }

  async function removeFilm(film: Film) {
    if (!window.confirm(`Excluir a página do filme "${film.title}"?`)) return;
    await adminApi.filmes.remove(film._id);
    setFilms((prev) => prev.filter((f) => f._id !== film._id));
  }

  async function removeCycle() {
    if (!cycle) return;
    if (!window.confirm(`Excluir o ciclo "${cycle.title}" e TODOS os seus filmes?`)) return;
    await adminApi.ciclos.remove(id);
    router.replace('/admin/ciclos');
  }

  if (error) return <p className="font-sans text-pink">{error}</p>;
  if (!cycle) return <p className="font-sans text-text-dark/60">carregando…</p>;

  return (
    <div className="flex flex-col gap-12">
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display font-black text-text-dark text-3xl">{cycle.title}</h1>
          <Link href={`/ciclos-mostras/${cycle.slug}`} target="_blank" className="font-display text-blue-link hover:underline">
            ver no site ↗
          </Link>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display font-bold text-text-dark text-xl">páginas de filmes</h2>
            <p className="font-sans text-sm text-text-dark/60">
              Cada filme da programação pode ter uma página própria com imagem, sinopse e texto.
            </p>
          </div>
          <Link
            href={`/admin/ciclos/${id}/filmes/novo`}
            className="bg-pink text-white font-display font-bold px-5 py-2 rounded hover:opacity-90 transition-opacity"
          >
            + novo filme
          </Link>
        </div>

        {films.length === 0 && <p className="font-serif text-text-dark/70">Nenhuma página de filme ainda.</p>}

        <div className="grid gap-2">
          {films.map((film, i) => (
            <div
              key={film._id}
              className="bg-white rounded-lg px-5 py-4 flex items-center gap-4 border border-text-dark/10"
            >
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label="mover para cima"
                  className="text-text-dark/50 hover:text-pink disabled:opacity-20 leading-none"
                >
                  ▲
                </button>
                <button
                  onClick={() => move(i, 1)}
                  disabled={i === films.length - 1}
                  aria-label="mover para baixo"
                  className="text-text-dark/50 hover:text-pink disabled:opacity-20 leading-none"
                >
                  ▼
                </button>
              </div>

              <div className="min-w-0">
                <p className="font-display font-bold text-text-dark truncate">
                  {film.title} ({film.year})
                </p>
                <p className="font-sans text-sm text-text-dark/60">
                  {film.director} · {film.duration} · {film.country}
                </p>
              </div>

              <div className="ml-auto flex items-center gap-4 shrink-0">
                <Link href={`/admin/filmes/${film._id}`} className="font-display text-blue-link hover:underline">
                  editar
                </Link>
                <button onClick={() => removeFilm(film)} className="font-display text-pink hover:underline">
                  excluir
                </button>
              </div>
            </div>
          ))}
        </div>

        <p className="font-sans text-xs text-text-dark/50 mt-3">
          Dica: para a sessão da programação virar link para a página do filme, o título do filme na
          programação deve ser o mesmo usado aqui.
        </p>
      </div>

      <div>
        <h2 className="font-display font-bold text-text-dark text-xl mb-4">dados da exibição e programação</h2>
        {saved && <p className="font-sans text-sm text-olive mb-2">salvo ✓</p>}
        <CycleForm initial={cycle} onSave={handleSaveCycle} />
        <button onClick={removeCycle} className="mt-6 font-display text-pink hover:underline">
          excluir esta exibição
        </button>
      </div>
    </div>
  );
}
