'use client';

import { useRouter } from 'next/navigation';
import MagazineForm from '@/components/admin/MagazineForm';
import { adminApi, MagazineInput } from '@/lib/adminApi';

export default function NovaRevistaPage() {
  const router = useRouter();

  async function handleSave(data: MagazineInput) {
    const mag = await adminApi.revistas.create(data);
    router.replace(`/admin/revistas/${mag._id}`);
  }

  return (
    <div>
      <h1 className="font-display font-black text-text-dark text-3xl mb-8">nova revista</h1>
      <MagazineForm onSave={handleSave} />
    </div>
  );
}
