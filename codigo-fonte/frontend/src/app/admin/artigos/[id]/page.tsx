'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import ArticleEditor from '@/components/admin/ArticleEditor';
import { useCarregar } from '@/components/admin/hooks';
import { useToast } from '@/components/admin/Toasts';
import { CabecalhoPagina, EstadoCarregando, EstadoErro } from '@/components/admin/ui';
import { adminApi, ArticleInput } from '@/lib/adminApi';

const SECAO = { revista: 'revistas', catalogo: 'catalogos', ciclo: 'ciclos' } as const;

export default function EditarTextoPage() {
  const { id } = useParams<{ id: string }>();
  const avisar = useToast();
  const { dados: article, setDados, erro, recarregar } = useCarregar(() => adminApi.artigos.get(id), [id]);

  if (erro) return <EstadoErro mensagem={erro} tentarDeNovo={recarregar} />;
  if (!article) return <EstadoCarregando />;

  // Salvar fica na página (sem redirecionar): o editor continua onde estava
  async function salvar(data: ArticleInput) {
    const atualizado = await adminApi.artigos.update(id, data);
    setDados(atualizado);
    avisar(atualizado.published === false ? 'Rascunho salvo. Ele não aparece no site.' : 'Texto salvo e publicado.');
  }

  return (
    <div>
      <CabecalhoPagina
        sobretitulo="editar texto"
        titulo={article.title}
        acoes={
          <Link href={`/admin/${SECAO[article.parentType]}/${article.parentId}`} className="font-display text-azul-escuro hover:underline">
            ← voltar para a lista
          </Link>
        }
      />
      <ArticleEditor key={article._id} parentId={article.parentId} parentType={article.parentType} initial={article} onSave={salvar} />
    </div>
  );
}
