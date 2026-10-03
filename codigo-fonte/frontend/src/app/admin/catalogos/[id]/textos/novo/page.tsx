'use client';

import { useParams, useRouter } from 'next/navigation';
import ArticleEditor from '@/components/admin/ArticleEditor';
import { adminApi, ArticleInput } from '@/lib/adminApi';

export default function NovoTextoCatalogoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  async function handleSave(data: ArticleInput) {
    await adminApi.artigos.create(data);
    router.replace(`/admin/catalogos/${id}`);
  }

  return (
    <div>
      <h1 className="font-display font-black text-text-dark text-3xl mb-8">novo texto do catálogo</h1>
      <ArticleEditor parentId={id} parentType="catalogo" onSave={handleSave} />
    </div>
  );
}
