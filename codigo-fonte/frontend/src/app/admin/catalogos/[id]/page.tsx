'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import CatalogForm from '@/components/admin/CatalogForm';
import { adminApi, CatalogInput } from '@/lib/adminApi';
import type { Article, Catalog } from '@/lib/types';

export default function CatalogoAdminPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    try {
      const [cats, arts] = await Promise.all([adminApi.catalogos.list(), adminApi.artigos.list(id)]);
      const cat = cats.find((c) => c._id === id);
      if (!cat) throw new Error('Catálogo não encontrado');
      setCatalog(cat);
      setArticles(arts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar');
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSaveCatalog(data: CatalogInput) {
    await adminApi.catalogos.update(id, data);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function move(index: number, dir: -1 | 1) {
    const next = [...articles];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setArticles(next);
    await adminApi.artigos.reorder(next.map((a) => a._id));
  }

  async function removeArticle(article: Article) {
    if (!window.confirm(`Excluir o texto "${article.title}"? Essa ação não pode ser desfeita.`)) return;
    await adminApi.artigos.remove(article._id);
    setArticles((prev) => prev.filter((a) => a._id !== article._id));
  }

  async function removeCatalog() {
    if (!catalog) return;
    if (!window.confirm(`Excluir o catálogo "${catalog.title}" e TODOS os seus textos?`)) return;
    await adminApi.catalogos.remove(id);
    router.replace('/admin/catalogos');
  }

  if (error) return <p className="font-sans text-pink">{error}</p>;
  if (!catalog) return <p className="font-sans text-text-dark/60">carregando…</p>;

  return (
    <div className="flex flex-col gap-12">
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display font-black text-text-dark text-3xl">{catalog.title}</h1>
          <Link href={`/catalogos/${catalog.slug}`} target="_blank" className="font-display text-blue-link hover:underline">
            ver no site ↗
          </Link>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-text-dark text-xl">textos</h2>
          <Link
            href={`/admin/catalogos/${id}/textos/novo`}
            className="bg-pink text-white font-display font-bold px-5 py-2 rounded hover:opacity-90 transition-opacity"
          >
            + novo texto
          </Link>
        </div>

        {articles.length === 0 && (
          <p className="font-serif text-text-dark/70">Nenhum texto neste catálogo ainda.</p>
        )}

        <div className="grid gap-2">
          {articles.map((article, i) => (
            <div
              key={article._id}
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
                  disabled={i === articles.length - 1}
                  aria-label="mover para baixo"
                  className="text-text-dark/50 hover:text-pink disabled:opacity-20 leading-none"
                >
                  ▼
                </button>
              </div>

              <div className="min-w-0">
                <p className="font-display font-bold text-text-dark truncate">{article.title}</p>
                <p className="font-sans text-sm text-text-dark/60">
                  {article.column} · por {article.author}
                  {article.published === false && <span className="text-gold"> · rascunho</span>}
                </p>
              </div>

              <div className="ml-auto flex items-center gap-4 shrink-0">
                <Link href={`/admin/artigos/${article._id}`} className="font-display text-blue-link hover:underline">
                  editar
                </Link>
                <button onClick={() => removeArticle(article)} className="font-display text-pink hover:underline">
                  excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-display font-bold text-text-dark text-xl mb-4">dados do catálogo</h2>
        {saved && <p className="font-sans text-sm text-olive mb-2">salvo ✓</p>}
        <CatalogForm initial={catalog} onSave={handleSaveCatalog} />
        <button onClick={removeCatalog} className="mt-6 font-display text-pink hover:underline">
          excluir este catálogo
        </button>
      </div>
    </div>
  );
}
