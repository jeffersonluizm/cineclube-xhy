'use client';

import Link from 'next/link';
import { adminApi } from '@/lib/adminApi';
import { useCarregar } from '@/components/admin/hooks';
import { BotaoLink, CabecalhoPagina, EstadoCarregando, EstadoErro, EstadoVazio } from '@/components/admin/ui';

export default function AdminCatalogosPage() {
  const { dados: catalogos, erro, recarregar } = useCarregar(() => adminApi.catalogos.list(), []);

  return (
    <div>
      <CabecalhoPagina titulo="catálogos" acoes={<BotaoLink href="/admin/catalogos/novo">+ novo catálogo</BotaoLink>} />

      {erro && <EstadoErro mensagem={erro} tentarDeNovo={recarregar} />}
      {!catalogos && !erro && <EstadoCarregando />}
      {catalogos?.length === 0 && <EstadoVazio>Nenhum catálogo ainda.</EstadoVazio>}

      {catalogos && catalogos.length > 0 && (
        <ul className="border-t border-text-dark/20">
          {catalogos.map((cat) => (
            <li key={cat._id}>
              <Link href={`/admin/catalogos/${cat._id}`} className="group flex items-baseline gap-4 py-4 border-b border-text-dark/20 hover:bg-papel px-2">
                <span className="font-display font-black text-gold-escuro text-lg">{cat.year}</span>
                <span className="font-display font-bold text-text-dark text-xl">{cat.title}</span>
                <span className="ml-auto font-display text-sm text-azul-escuro group-hover:underline">gerenciar →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
