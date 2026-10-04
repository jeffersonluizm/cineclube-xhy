import type { Metadata } from 'next';
import ListaPorAno from '@/components/ListaPorAno';
import { api } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Exibições',
  description: 'Ciclos e mostras de cinema realizados pelo Cineclube XHY, por ano.',
  alternates: { canonical: '/ciclos-mostras' },
};

export default async function CiclosMostrasPage() {
  const ciclos = await api.ciclos.list();
  return (
    <ListaPorAno
      titulo="Exibições: ciclos e mostras"
      migalha="exibições"
      itens={ciclos}
      href={(c) => `/ciclos-mostras/${c.slug}`}
      rotulo={(c) => c.title}
      detalhe={(c) => c.subtitle}
      vazio="Nenhuma exibição publicada ainda."
    />
  );
}
