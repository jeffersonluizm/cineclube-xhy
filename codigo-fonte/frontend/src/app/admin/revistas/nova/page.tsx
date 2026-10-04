'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MagazineForm from '@/components/admin/MagazineForm';
import { useToast } from '@/components/admin/Toasts';
import { CabecalhoPagina } from '@/components/admin/ui';
import { adminApi, MagazineInput } from '@/lib/adminApi';

export default function NovaRevistaPage() {
  const router = useRouter();
  const avisar = useToast();

  async function salvar(data: MagazineInput) {
    const novo = await adminApi.revistas.create(data);
    avisar('Revista criada. Agora adicione os textos.');
    router.replace(`/admin/revistas/${novo._id}`);
  }

  return (
    <div>
      <CabecalhoPagina
        titulo="nova revista"
        acoes={
          <Link href="/admin/revistas" className="font-display text-azul-escuro hover:underline">
            cancelar
          </Link>
        }
      />
      <MagazineForm onSave={salvar} />
    </div>
  );
}
