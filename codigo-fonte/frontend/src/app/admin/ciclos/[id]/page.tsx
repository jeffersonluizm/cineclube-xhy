'use client';

import { useCallback, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import CycleForm from '@/components/admin/CycleForm';
import ListaReordenavel from '@/components/admin/ListaReordenavel';
import { DialogoExclusao } from '@/components/admin/Dialogo';
import { useCarregar } from '@/components/admin/hooks';
import { useToast } from '@/components/admin/Toasts';
import { Botao, BotaoLink, CabecalhoPagina, EstadoCarregando, EstadoErro, Secao } from '@/components/admin/ui';
import { adminApi, CycleInput } from '@/lib/adminApi';
import type { Article, Film } from '@/lib/types';

export default function CicloAdminPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const avisar = useToast();
  const [excluindo, setExcluindo] = useState(false);
  const { dados, setDados, erro, recarregar } = useCarregar(async () => {
    const [cycle, films, articles] = await Promise.all([adminApi.ciclos.get(id), adminApi.filmes.list(id), adminApi.artigos.list(id)]);
    return { cycle, films, articles };
  }, [id]);
  const impacto = useCallback(() => adminApi.ciclos.impacto(id), [id]);

  if (erro) return <EstadoErro mensagem={erro} tentarDeNovo={recarregar} />;
  if (!dados) return <EstadoCarregando />;
  const { cycle, films, articles } = dados;

  async function salvar(data: CycleInput) {
    const atualizado = await adminApi.ciclos.update(id, data);
    setDados((d) => (d ? { ...d, cycle: atualizado } : d));
    avisar('Exibição e programação salvas.');
  }

  return (
    <div className="flex flex-col gap-12">
      <CabecalhoPagina
        sobretitulo="exibição"
        titulo={cycle.title}
        acoes={
          <a href={`/ciclos-mostras/${cycle.slug}`} target="_blank" rel="noopener" className="font-display text-azul-escuro hover:underline">
            ver no site ↗
          </a>
        }
      />

      <Secao
        titulo="páginas de filmes"
        descricao="Cada filme pode ter uma página com imagem, sinopse e texto. Na programação, escolha a página de cada sessão."
        acoes={<BotaoLink href={`/admin/ciclos/${id}/filmes/novo`}>+ novo filme</BotaoLink>}
      >
        <ListaReordenavel<Film>
          itens={films}
          aoMudar={(novos) => setDados((d) => (d ? { ...d, films: novos } : d))}
          titulo={(f) => `${f.title} (${f.year})`}
          detalhe={(f) => `${f.director} · ${f.duration} · ${f.country}`}
          hrefEditar={(f) => `/admin/filmes/${f._id}`}
          reordenar={adminApi.filmes.reorder}
          excluir={(f) => adminApi.filmes.remove(f._id)}
          artigo="a página do filme"
          vazio="Nenhuma página de filme ainda."
        />
      </Secao>

      <Secao
        titulo="textos"
        descricao="Textos publicados aparecem na página da exibição, abaixo da programação."
        acoes={<BotaoLink href={`/admin/ciclos/${id}/textos/novo`}>+ novo texto</BotaoLink>}
      >
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
          vazio="Nenhum texto nesta exibição ainda."
        />
      </Secao>

      <Secao titulo="dados da exibição e programação">
        <CycleForm key={cycle._id} initial={cycle} filmes={films} onSave={salvar} />
      </Secao>

      <Secao titulo="zona de perigo">
        <Botao variante="perigo" onClick={() => setExcluindo(true)}>
          excluir esta exibição
        </Botao>
      </Secao>

      <DialogoExclusao
        aberto={excluindo}
        oQue={`a exibição "${cycle.title}"`}
        confirmacao={cycle.title}
        carregarImpacto={impacto}
        aoFechar={() => setExcluindo(false)}
        aoConfirmar={async () => {
          await adminApi.ciclos.remove(id);
          avisar(`Exibição "${cycle.title}" excluída.`);
          router.replace('/admin/ciclos');
        }}
      />
    </div>
  );
}
