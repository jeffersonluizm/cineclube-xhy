'use client';

import Link from 'next/link';
import { adminApi } from '@/lib/adminApi';
import { useCarregar } from '@/components/admin/hooks';
import { BotaoLink, CabecalhoPagina, EstadoCarregando, EstadoErro, EstadoVazio } from '@/components/admin/ui';

export default function AdminRevistasPage() {
  const { dados: revistas, erro, recarregar } = useCarregar(() => adminApi.revistas.list(), []);

  return (
    <div>
      <CabecalhoPagina titulo="revistas" acoes={<BotaoLink href="/admin/revistas/nova">+ nova revista</BotaoLink>} />

      {erro && <EstadoErro mensagem={erro} tentarDeNovo={recarregar} />}
      {!revistas && !erro && <EstadoCarregando />}
      {revistas?.length === 0 && <EstadoVazio>Nenhuma revista ainda. Crie a primeira edição para começar a publicar.</EstadoVazio>}

      {revistas && revistas.length > 0 && (
        <ul className="border-t border-text-dark/20">
          {revistas.map((mag) => (
            <li key={mag._id}>
              <Link
                href={`/admin/revistas/${mag._id}`}
                className="group flex items-baseline gap-4 py-4 border-b border-text-dark/20 hover:bg-papel px-2"
              >
                <span className="font-display font-black text-pink-escuro text-2xl">n°{mag.number}</span>
                <span className="font-serif text-text-dark text-lg">
                  v.{mag.volume}, {mag.month}, {mag.year}
                </span>
                <span className="ml-auto font-display text-sm text-azul-escuro group-hover:underline">gerenciar →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
