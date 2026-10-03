'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ArticleEditor from '@/components/admin/ArticleEditor';
import { adminApi, ArticleInput } from '@/lib/adminApi';
import type { Article } from '@/lib/types';

export default function EditarArtigoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.artigos
      .get(id)
      .then(setArticle)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar'));
  }, [id]);

  async function handleSave(data: ArticleInput) {
    await adminApi.artigos.update(id, data);
    if (!article) return;
    const section = article.parentType === 'catalogo' ? 'catalogos' : article.parentType === 'ciclo' ? 'ciclos' : 'revistas';
    router.replace(`/admin/${section}/${article.parentId}`);
  }

  if (error) return <p className="font-sans text-pink">{error}</p>;
  if (!article) return <p className="font-sans text-text-dark/60">carregando…</p>;

  return (
    <div>
      <h1 className="font-display font-black text-text-dark text-3xl mb-8">editar artigo</h1>
      <ArticleEditor
        parentId={article.parentId}
        parentType={article.parentType}
        initial={article}
        onSave={handleSave}
      />
    </div>
  );
}
