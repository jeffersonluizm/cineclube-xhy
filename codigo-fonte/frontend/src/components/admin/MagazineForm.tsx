'use client';

import { useState } from 'react';
import { MagazineInput } from '@/lib/adminApi';
import type { Magazine } from '@/lib/types';
import ImageUploadField from './ImageUploadField';
import AvisoSaida from './AvisoSaida';
import { useSujo } from './hooks';
import { Alerta, AreaTexto, BarraSalvar, Campo } from './ui';

interface MagazineFormProps {
  initial?: Magazine;
  onSave: (data: MagazineInput) => Promise<void>;
}

export default function MagazineForm({ initial, onSave }: MagazineFormProps) {
  const [v, setV] = useState({
    number: initial ? String(initial.number) : '',
    volume: initial ? String(initial.volume) : '1',
    month: initial?.month ?? '',
    year: initial ? String(initial.year) : String(new Date().getFullYear()),
    editorial: initial?.editorial ?? '',
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
      await onSave({
        number: Number(v.number),
        volume: Number(v.volume),
        month: v.month.trim().toLowerCase(),
        year: Number(v.year),
        editorial: v.editorial.trim(),
        coverImage: v.coverImage,
      });
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
      <div className="grid grid-cols-3 gap-4">
        <Campo rotulo="número" type="number" min={1} value={v.number} onChange={alterar('number')} required />
        <Campo rotulo="volume" type="number" min={1} value={v.volume} onChange={alterar('volume')} required />
        <Campo rotulo="ano" type="number" min={1890} max={2100} value={v.year} onChange={alterar('year')} required />
      </div>
      <Campo rotulo="mês" dica="ex.: março" value={v.month} onChange={alterar('month')} required />
      <AreaTexto rotulo="editorial" value={v.editorial} onChange={alterar('editorial')} rows={5} />
      <ImageUploadField label="capa da edição" value={v.coverImage} onChange={(url) => setV((x) => ({ ...x, coverImage: url }))} />
      {erro && <Alerta>{erro}</Alerta>}
      <BarraSalvar salvando={salvando} sujo={initial ? sujo : undefined} rotulo={initial ? 'salvar' : 'criar revista'} />
    </form>
  );
}
