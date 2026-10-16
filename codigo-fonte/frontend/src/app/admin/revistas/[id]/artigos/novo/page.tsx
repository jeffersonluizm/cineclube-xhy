'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import ArticleEditor from '@/components/admin/ArticleEditor';
import { useToast } from '@/components/admin/Toasts';
import { CabecalhoPagina } from '@/components/admin/ui';
import { adminApi, ArticleInput } from '@/lib/adminApi';

export default function NovoTextoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const avisar = useToast();

  async function salvar(data: ArticleInput) {
    const novo = await adminApi.artigos.create(data);
    avisar(novo.published === false ? 'Rascunho criado. Ele não aparece no site.' : 'Texto publicado.');
    router.replace(`/admin/revistas/${id}`);
  }

  return (
    <div>
      <CabecalhoPagina
        titulo="novo texto"
        acoes={
          <Link href={`/admin/revistas/${id}`} className="font-display text-azul-escuro hover:underline">
            cancelar
          </Link>
        }
      />
      <ArticleEditor parentId={id} parentType="revista" onSave={salvar} />
    </div>
  );
}
