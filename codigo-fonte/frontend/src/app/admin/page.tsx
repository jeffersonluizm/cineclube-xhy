'use client';

import Link from 'next/link';
import { adminApi } from '@/lib/adminApi';
import { useCarregar } from '@/components/admin/hooks';
import { BotaoLink, CabecalhoPagina, EstadoCarregando, EstadoErro, EstadoVazio, Secao } from '@/components/admin/ui';
import type { ResumoPainel } from '@/lib/types';

const quando = (iso?: string) =>
  iso ? new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

function ListaTextos({ textos, vazio }: { textos: ResumoPainel['rascunhos']; vazio: string }) {
  if (textos.length === 0) return <EstadoVazio>{vazio}</EstadoVazio>;
  return (
    <ul className="border-t border-text-dark/20">
      {textos.map((t) => (
        <li key={t._id} className="py-3 border-b border-text-dark/20 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <Link href={`/admin/artigos/${t._id}`} className="font-display font-bold text-text-dark hover:text-olive-escuro hover:underline">
            {t.title}
          </Link>
          <span className="font-sans text-sm text-text-suave">{t.onde}</span>
          {t.published === false && <span className="font-sans text-xs font-bold text-gold-escuro uppercase tracking-wider">rascunho</span>}
          <span className="font-sans text-xs text-text-suave ml-auto">{quando(t.updatedAt)}</span>
        </li>
      ))}
    </ul>
  );
}

/** Início do painel: números, rascunhos pendentes, últimas edições e atalhos */
export default function PainelInicio() {
  const { dados, erro, recarregar } = useCarregar(() => adminApi.resumo(), []);

  const numeros = dados
    ? [
        { rotulo: 'revistas', valor: dados.contagens.revistas, href: '/admin/revistas' },
        { rotulo: 'catálogos', valor: dados.contagens.catalogos, href: '/admin/catalogos' },
        { rotulo: 'exibições', valor: dados.contagens.ciclos, href: '/admin/ciclos' },
        { rotulo: 'páginas de filme', valor: dados.contagens.filmes, href: '/admin/ciclos' },
        { rotulo: 'textos publicados', valor: dados.contagens.textosPublicados },
        { rotulo: 'rascunhos', valor: dados.contagens.rascunhos },
      ]
    : [];

  return (
    // O cabeçalho já traz a própria margem (como nas outras telas): fica fora do gap das seções,
    // senão o vão entre o título e os números somava 80 px
    <div>
      <CabecalhoPagina
        sobretitulo="painel do editor"
        titulo="início"
        acoes={
          <>
            <BotaoLink href="/admin/revistas/nova">+ nova revista</BotaoLink>
            <BotaoLink href="/admin/ciclos/novo" variante="secundario">
              + nova exibição
            </BotaoLink>
          </>
        }
      />
      <div className="flex flex-col gap-12">
        {erro && <EstadoErro mensagem={`Não foi possível carregar o resumo: ${erro}`} tentarDeNovo={recarregar} />}
        {!dados && !erro && <EstadoCarregando />}

        {dados && (
          <>
            <dl className="grid grid-cols-2 sm:grid-cols-3 border-l border-t border-text-dark/30">
              {numeros.map((n) => (
                <div key={n.rotulo} className="border-r border-b border-text-dark/30 px-5 py-4">
                  <dt className="font-sans text-sm text-text-suave">{n.rotulo}</dt>
                  <dd className="font-display font-black text-4xl text-text-dark">
                    {n.href ? (
                      <Link href={n.href} className="hover:text-olive-escuro hover:underline">
                        {n.valor}
                      </Link>
                    ) : (
                      n.valor
                    )}
                  </dd>
                </div>
              ))}
            </dl>

            <Secao titulo="rascunhos esperando revisão" descricao="Textos que não aparecem no site até serem publicados.">
              <ListaTextos textos={dados.rascunhos} vazio="Nenhum rascunho pendente." />
            </Secao>

            <Secao titulo="editados por último">
              <ListaTextos textos={dados.ultimosEditados} vazio="Nada editado ainda. Comece criando uma revista." />
            </Secao>
          </>
        )}
      </div>
    </div>
  );
}
