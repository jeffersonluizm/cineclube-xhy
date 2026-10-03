'use client';

import { useParams, useRouter } from 'next/navigation';
import ArticleEditor from '@/components/admin/ArticleEditor';
import { adminApi, ArticleInput } from '@/lib/adminApi';

export default function NovoArtigoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  async function handleSave(data: ArticleInput) {
    await adminApi.artigos.create(data);
    router.replace(`/admin/revistas/${id}`);
  }

  return (
    <div>
      <h1 className="font-display font-black text-text-dark text-3xl mb-8">novo artigo</h1>
      <ArticleEditor parentId={id} onSave={handleSave} />
    </div>
  );
}
