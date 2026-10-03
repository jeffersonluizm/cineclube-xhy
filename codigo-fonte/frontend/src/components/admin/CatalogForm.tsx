'use client';

import { useState } from 'react';
import { CatalogInput } from '@/lib/adminApi';
import ImageUploadField from './ImageUploadField';
import type { Catalog } from '@/lib/types';

interface CatalogFormProps {
  initial?: Catalog;
  onSave: (data: CatalogInput) => Promise<void>;
}

const inputClass =
  'mt-1 w-full border border-text-dark/30 rounded px-3 py-2 bg-white font-sans text-text-dark focus:outline-none focus:border-pink';

export default function CatalogForm({ initial, onSave }: CatalogFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [year, setYear] = useState(initial ? String(initial.year) : String(new Date().getFullYear()));
  const [description, setDescription] = useState(initial?.description ?? '');
  const [coverImage, setCoverImage] = useState(initial?.coverImage ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        year: Number(year),
        description: description.trim() || undefined,
        coverImage: coverImage || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg p-8 border border-text-dark/10 max-w-xl flex flex-col gap-5">
      <label>
        <span className="font-display text-sm text-text-dark">título (ex.: David Lynch e seus precursores)</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} required className={inputClass} />
      </label>

      <label className="max-w-[10rem]">
        <span className="font-display text-sm text-text-dark">ano</span>
        <input type="number" value={year} onChange={(e) => setYear(e.target.value)} required className={inputClass} />
      </label>

      <label>
        <span className="font-display text-sm text-text-dark">apresentação / descrição (opcional)</span>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} className={inputClass} />
      </label>

      <ImageUploadField label="capa do catálogo" value={coverImage} onChange={setCoverImage} />

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
