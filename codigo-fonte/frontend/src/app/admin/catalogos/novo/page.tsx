'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CatalogForm from '@/components/admin/CatalogForm';
import { useToast } from '@/components/admin/Toasts';
import { CabecalhoPagina } from '@/components/admin/ui';
import { adminApi, CatalogInput } from '@/lib/adminApi';

export default function NovoCatalogoPage() {
  const router = useRouter();
  const avisar = useToast();

  async function salvar(data: CatalogInput) {
    const novo = await adminApi.catalogos.create(data);
    avisar('Catálogo criado. Agora adicione os textos.');
    router.replace(`/admin/catalogos/${novo._id}`);
  }

  return (
    <div>
      <CabecalhoPagina
        titulo="novo catálogo"
        acoes={
          <Link href="/admin/catalogos" className="font-display text-azul-escuro hover:underline">
            cancelar
          </Link>
        }
      />
      <CatalogForm onSave={salvar} />
    </div>
  );
}
