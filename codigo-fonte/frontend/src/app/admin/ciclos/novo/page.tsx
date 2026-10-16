'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CycleForm from '@/components/admin/CycleForm';
import { useToast } from '@/components/admin/Toasts';
import { CabecalhoPagina } from '@/components/admin/ui';
import { adminApi, CycleInput } from '@/lib/adminApi';

export default function NovoCicloPage() {
  const router = useRouter();
  const avisar = useToast();

  async function salvar(data: CycleInput) {
    const novo = await adminApi.ciclos.create(data);
    avisar('Exibição criada. Agora crie as páginas dos filmes.');
    router.replace(`/admin/ciclos/${novo._id}`);
  }

  return (
    <div>
      <CabecalhoPagina
        titulo="nova exibição"
        acoes={
          <Link href="/admin/ciclos" className="font-display text-azul-escuro hover:underline">
            cancelar
          </Link>
        }
      />
      <CycleForm onSave={salvar} />
    </div>
  );
}
