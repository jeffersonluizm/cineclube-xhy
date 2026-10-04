'use client';

import { useState } from 'react';
import { CatalogInput } from '@/lib/adminApi';
import type { Catalog } from '@/lib/types';
import ImageUploadField from './ImageUploadField';
import AvisoSaida from './AvisoSaida';
import { useSujo } from './hooks';
import { Alerta, AreaTexto, BarraSalvar, Campo } from './ui';

interface CatalogFormProps {
  initial?: Catalog;
  onSave: (data: CatalogInput) => Promise<void>;
}

export default function CatalogForm({ initial, onSave }: CatalogFormProps) {
  const [v, setV] = useState({
    title: initial?.title ?? '',
    year: initial ? String(initial.year) : String(new Date().getFullYear()),
    description: initial?.description ?? '',
    coverImage: initial?.coverImage ?? '',
  });
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const { sujo, marcarSalvo } = useSujo(v);
  const alterar = (campo: keyof typeof v) => (e: { target: { value: string } }) => setV((x) => ({ ...x, [campo]: e.target.value }));

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setSalvando(true);
    try {
      await onSave({ title: v.title.trim(), year: Number(v.year), description: v.description.trim(), coverImage: v.coverImage });
      marcarSalvo();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="max-w-xl flex flex-col gap-5">
      <AvisoSaida sujo={sujo && !salvando} />
      <div className="grid gap-4 sm:grid-cols-[1fr,8rem]">
        <Campo rotulo="título" value={v.title} onChange={alterar('title')} required />
        <Campo rotulo="ano" type="number" min={1890} max={2100} value={v.year} onChange={alterar('year')} required />
      </div>
      <AreaTexto rotulo="apresentação" dica="aparece ao lado da capa" value={v.description} onChange={alterar('description')} rows={4} />
      <ImageUploadField label="capa do catálogo" value={v.coverImage} onChange={(url) => setV((x) => ({ ...x, coverImage: url }))} />
      {erro && <Alerta>{erro}</Alerta>}
      <BarraSalvar salvando={salvando} sujo={initial ? sujo : undefined} rotulo={initial ? 'salvar' : 'criar catálogo'} />
    </form>
  );
}
