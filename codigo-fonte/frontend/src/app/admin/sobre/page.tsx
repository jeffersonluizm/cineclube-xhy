'use client';

import { useEffect, useState } from 'react';
import AboutForm from '@/components/admin/AboutForm';
import { adminApi, AboutInput } from '@/lib/adminApi';
import type { About } from '@/lib/types';

export default function AdminSobrePage() {
  const [about, setAbout] = useState<About | null>(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    adminApi.sobre
      .get()
      .then(setAbout)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar'));
  }, []);

  async function handleSave(data: AboutInput) {
    const updated = await adminApi.sobre.update(data);
    setAbout(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (error) return <p className="font-sans text-pink">{error}</p>;
  if (!about) return <p className="font-sans text-text-dark/60">carregando…</p>;

  return (
    <div>
      <h1 className="font-display font-black text-text-dark text-3xl mb-8">sobre</h1>
      {saved && <p className="font-sans text-sm text-olive mb-4">salvo ✓</p>}
      <AboutForm initial={about} onSave={handleSave} />
    </div>
  );
}
