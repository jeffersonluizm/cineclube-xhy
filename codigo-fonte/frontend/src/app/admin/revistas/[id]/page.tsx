'use client';

import { useCallback, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import MagazineForm from '@/components/admin/MagazineForm';
import ListaReordenavel from '@/components/admin/ListaReordenavel';
import { DialogoExclusao } from '@/components/admin/Dialogo';
import { useCarregar } from '@/components/admin/hooks';
import { useToast } from '@/components/admin/Toasts';
import { Botao, BotaoLink, CabecalhoPagina, EstadoCarregando, EstadoErro, ItemNaoEncontrado, Secao } from '@/components/admin/ui';
import { adminApi, MagazineInput } from '@/lib/adminApi';
import type { Article } from '@/lib/types';

export default function RevistaAdminPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const avisar = useToast();
  const [excluindo, setExcluindo] = useState(false);
  const { dados, setDados, erro, naoEncontrado, recarregar } = useCarregar(async () => {
    const [magazine, articles] = await Promise.all([adminApi.revistas.get(id), adminApi.artigos.list(id)]);
    return { magazine, articles };
  }, [id]);
  const impacto = useCallback(() => adminApi.revistas.impacto(id), [id]);

  if (naoEncontrado) return <ItemNaoEncontrado oQue="Esta revista" lista="/admin/revistas" rotuloLista="revistas" />;
  if (erro) return <EstadoErro mensagem={erro} tentarDeNovo={recarregar} />;
  if (!dados) return <EstadoCarregando />;
  const { magazine, articles } = dados;

  async function salvar(data: MagazineInput) {
    const atualizada = await adminApi.revistas.update(id, data);
    setDados((d) => (d ? { ...d, magazine: atualizada } : d));
    avisar('Dados da edição salvos.');
  }

  return (
    <div className="flex flex-col gap-12">
      <CabecalhoPagina
        sobretitulo="revista"
        titulo={`n°${magazine.number}, ${magazine.month} de ${magazine.year}`}
        acoes={
          <a href={`/revista/${magazine.number}`} target="_blank" rel="noopener" className="font-display text-azul-escuro hover:underline">
            ver no site ↗
          </a>
        }
      />

      <Secao
        titulo="textos"
        descricao="A ordem aqui é a ordem do sumário. Rascunhos não aparecem no site."
        acoes={<BotaoLink href={`/admin/revistas/${id}/artigos/novo`}>+ novo texto</BotaoLink>}
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
          vazio="Nenhum texto nesta edição ainda."
        />
      </Secao>

      <Secao titulo="dados da edição">
        <MagazineForm key={magazine._id} initial={magazine} onSave={salvar} />
      </Secao>

      <Secao titulo="zona de perigo">
        <Botao variante="perigo" onClick={() => setExcluindo(true)}>
          excluir esta revista
        </Botao>
      </Secao>

      <DialogoExclusao
        aberto={excluindo}
        oQue={`a revista n°${magazine.number}`}
        confirmacao={`revista ${magazine.number}`}
        carregarImpacto={impacto}
        aoFechar={() => setExcluindo(false)}
        aoConfirmar={async () => {
          await adminApi.revistas.remove(id);
          avisar(`Revista n°${magazine.number} excluída.`);
          router.replace('/admin/revistas');
        }}
      />
    </div>
  );
}
