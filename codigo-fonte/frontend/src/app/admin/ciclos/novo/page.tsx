'use client';

import { useRouter } from 'next/navigation';
import CycleForm from '@/components/admin/CycleForm';
import { adminApi, CycleInput } from '@/lib/adminApi';

export default function NovoCicloPage() {
  const router = useRouter();

  async function handleSave(data: CycleInput) {
    const cycle = await adminApi.ciclos.create(data);
    router.replace(`/admin/ciclos/${cycle._id}`);
  }

  return (
    <div>
      <h1 className="font-display font-black text-text-dark text-3xl mb-8">nova exibição</h1>
      <CycleForm onSave={handleSave} />
    </div>
  );
}
