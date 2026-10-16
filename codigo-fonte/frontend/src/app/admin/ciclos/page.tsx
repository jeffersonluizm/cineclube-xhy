'use client';

import Link from 'next/link';
import { adminApi } from '@/lib/adminApi';
import { useCarregar } from '@/components/admin/hooks';
import { BotaoLink, CabecalhoPagina, EstadoCarregando, EstadoErro, EstadoVazio } from '@/components/admin/ui';

export default function AdminCiclosPage() {
  const { dados: ciclos, erro, recarregar } = useCarregar(() => adminApi.ciclos.list(), []);

  return (
    <div>
      <CabecalhoPagina titulo="exibições" acoes={<BotaoLink href="/admin/ciclos/novo">+ nova exibição</BotaoLink>} />

      {erro && <EstadoErro mensagem={erro} tentarDeNovo={recarregar} />}
      {!ciclos && !erro && <EstadoCarregando />}
      {ciclos?.length === 0 && <EstadoVazio>Nenhuma exibição ainda.</EstadoVazio>}

      {ciclos && ciclos.length > 0 && (
        <ul className="border-t border-text-dark/20">
          {ciclos.map((c) => (
            <li key={c._id}>
              <Link
                href={`/admin/ciclos/${c._id}`}
                className="group flex flex-wrap items-baseline gap-x-4 py-4 border-b border-text-dark/20 hover:bg-papel px-2"
              >
                <span className="font-display font-black text-gold-escuro text-lg">{c.year}</span>
                <span className="font-display font-bold text-text-dark text-xl">{c.title}</span>
                {c.subtitle && <span className="font-serif italic text-text-suave">{c.subtitle}</span>}
                <span className="ml-auto font-display text-sm text-azul-escuro group-hover:underline">gerenciar →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
