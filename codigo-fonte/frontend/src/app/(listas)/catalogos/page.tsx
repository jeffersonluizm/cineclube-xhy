import type { Metadata } from 'next';
import ListaPorAno from '@/components/ListaPorAno';
import { api } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Catálogos',
  description: 'Catálogos publicados pelo Cineclube XHY, por ano.',
  alternates: { canonical: '/catalogos' },
};

export default async function CatalogosPage() {
  const catalogos = await api.catalogos.list();
  return (
    <ListaPorAno
      titulo="Catálogos do Cineclube XHY"
      migalha="catálogos"
      itens={catalogos}
      href={(c) => `/catalogos/${c.slug}`}
      rotulo={(c) => c.title}
      vazio="Nenhum catálogo publicado ainda."
    />
  );
}
