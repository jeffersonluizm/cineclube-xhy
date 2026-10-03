'use client';

import { useRouter } from 'next/navigation';
import CatalogForm from '@/components/admin/CatalogForm';
import { adminApi, CatalogInput } from '@/lib/adminApi';

export default function NovoCatalogoPage() {
  const router = useRouter();

  async function handleSave(data: CatalogInput) {
    const cat = await adminApi.catalogos.create(data);
    router.replace(`/admin/catalogos/${cat._id}`);
  }

  return (
    <div>
      <h1 className="font-display font-black text-text-dark text-3xl mb-8">novo catálogo</h1>
      <CatalogForm onSave={handleSave} />
    </div>
  );
}
