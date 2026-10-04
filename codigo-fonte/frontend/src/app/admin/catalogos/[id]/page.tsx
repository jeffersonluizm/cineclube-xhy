'use client';

import { useCallback, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import CatalogForm from '@/components/admin/CatalogForm';
import ListaReordenavel from '@/components/admin/ListaReordenavel';
import { DialogoExclusao } from '@/components/admin/Dialogo';
import { useCarregar } from '@/components/admin/hooks';
import { useToast } from '@/components/admin/Toasts';
import { Botao, BotaoLink, CabecalhoPagina, EstadoCarregando, EstadoErro, Secao } from '@/components/admin/ui';
import { adminApi, CatalogInput } from '@/lib/adminApi';
import type { Article } from '@/lib/types';

export default function CatalogoAdminPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const avisar = useToast();
  const [excluindo, setExcluindo] = useState(false);
  const { dados, setDados, erro, recarregar } = useCarregar(async () => {
    const [catalog, articles] = await Promise.all([adminApi.catalogos.get(id), adminApi.artigos.list(id)]);
    return { catalog, articles };
  }, [id]);
  const impacto = useCallback(() => adminApi.catalogos.impacto(id), [id]);

  if (erro) return <EstadoErro mensagem={erro} tentarDeNovo={recarregar} />;
  if (!dados) return <EstadoCarregando />;
  const { catalog, articles } = dados;

  async function salvar(data: CatalogInput) {
    const atualizado = await adminApi.catalogos.update(id, data);
    setDados((d) => (d ? { ...d, catalog: atualizado } : d));
    avisar('Dados do catálogo salvos.');
  }

  return (
    <div className="flex flex-col gap-12">
      <CabecalhoPagina
        sobretitulo="catálogo"
        titulo={catalog.title}
        acoes={
          <a href={`/catalogos/${catalog.slug}`} target="_blank" rel="noopener" className="font-display text-azul-escuro hover:underline">
            ver no site ↗
          </a>
        }
      />

      <Secao titulo="textos" descricao="Agrupados por seção na página do catálogo, nesta ordem." acoes={<BotaoLink href={`/admin/catalogos/${id}/textos/novo`}>+ novo texto</BotaoLink>}>
        <ListaReordenavel<Article>
          itens={articles}
          aoMudar={(novos) => setDados((d) => (d ? { ...d, articles: novos } : d))}
          titulo={(a) => a.title}
          detalhe={(a) => (
            <>
              {a.column} · por {a.author}
              {a.published === false && <span className="text-gold-escuro font-bold"> · rascunho</span>}
            </>
          )}
          hrefEditar={(a) => `/admin/artigos/${a._id}`}
          reordenar={adminApi.artigos.reorder}
          excluir={(a) => adminApi.artigos.remove(a._id)}
          artigo="o texto"
          vazio="Nenhum texto neste catálogo ainda."
        />
      </Secao>

      <Secao titulo="dados do catálogo">
        <CatalogForm key={catalog._id} initial={catalog} onSave={salvar} />
      </Secao>

      <Secao titulo="zona de perigo">
        <Botao variante="perigo" onClick={() => setExcluindo(true)}>
          excluir este catálogo
        </Botao>
      </Secao>

      <DialogoExclusao
        aberto={excluindo}
        oQue={`o catálogo "${catalog.title}"`}
        confirmacao={catalog.title}
        carregarImpacto={impacto}
        aoFechar={() => setExcluindo(false)}
        aoConfirmar={async () => {
          await adminApi.catalogos.remove(id);
          avisar(`Catálogo "${catalog.title}" excluído.`);
          router.replace('/admin/catalogos');
        }}
      />
    </div>
  );
}
