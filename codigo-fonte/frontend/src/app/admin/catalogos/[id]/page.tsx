'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import CatalogForm from '@/components/admin/CatalogForm';
import ArticleList from '@/components/admin/ArticleList';
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

        <ArticleList
          articles={articles}
          onChange={setArticles}
          newHref={`/admin/catalogos/${id}/textos/novo`}
          emptyText="Nenhum texto neste catálogo ainda."
        />
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
