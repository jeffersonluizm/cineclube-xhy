'use client';

import { useState } from 'react';
import { MagazineInput } from '@/lib/adminApi';
import ImageUploadField from './ImageUploadField';
import type { Magazine } from '@/lib/types';

interface MagazineFormProps {
  initial?: Magazine;
  onSave: (data: MagazineInput) => Promise<void>;
}

const inputClass =
  'mt-1 w-full border border-text-dark/30 rounded px-3 py-2 bg-white font-sans text-text-dark focus:outline-none focus:border-pink';

export default function MagazineForm({ initial, onSave }: MagazineFormProps) {
  const [number, setNumber] = useState(initial ? String(initial.number) : '');
  const [volume, setVolume] = useState(initial ? String(initial.volume) : '1');
  const [month, setMonth] = useState(initial?.month ?? '');
  const [year, setYear] = useState(initial ? String(initial.year) : String(new Date().getFullYear()));
  const [editorial, setEditorial] = useState(initial?.editorial ?? '');
  const [coverImage, setCoverImage] = useState(initial?.coverImage ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSave({
        number: Number(number),
        volume: Number(volume),
        month: month.trim().toLowerCase(),
        year: Number(year),
        editorial: editorial.trim() || undefined,
        coverImage: coverImage || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg p-8 border border-text-dark/10 max-w-xl flex flex-col gap-5">
      <div className="grid grid-cols-3 gap-4">
        <label>
          <span className="font-display text-sm text-text-dark">número</span>
          <input type="number" value={number} onChange={(e) => setNumber(e.target.value)} required className={inputClass} />
        </label>
        <label>
          <span className="font-display text-sm text-text-dark">volume</span>
          <input type="number" value={volume} onChange={(e) => setVolume(e.target.value)} required className={inputClass} />
        </label>
        <label>
          <span className="font-display text-sm text-text-dark">ano</span>
          <input type="number" value={year} onChange={(e) => setYear(e.target.value)} required className={inputClass} />
        </label>
      </div>

      <label>
        <span className="font-display text-sm text-text-dark">mês (ex.: março)</span>
        <input value={month} onChange={(e) => setMonth(e.target.value)} required className={inputClass} />
      </label>

      <label>
        <span className="font-display text-sm text-text-dark">editorial (opcional)</span>
        <textarea value={editorial} onChange={(e) => setEditorial(e.target.value)} rows={5} className={inputClass} />
      </label>

      <ImageUploadField label="capa da edição" value={coverImage} onChange={setCoverImage} />

      {error && <p className="font-sans text-sm text-pink">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="self-start bg-pink text-white font-display font-bold px-6 py-2 rounded hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {saving ? 'salvando…' : 'salvar'}
      </button>
    </form>
  );
}
