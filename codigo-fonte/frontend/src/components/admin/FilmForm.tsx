'use client';

import { useState } from 'react';
import { FilmInput } from '@/lib/adminApi';
import ImageUploadField from './ImageUploadField';
import type { Film } from '@/lib/types';

interface FilmFormProps {
  cycleId: string;
  initial?: Film;
  onSave: (data: FilmInput) => Promise<void>;
}

const inputClass =
  'mt-1 w-full border border-text-dark/30 rounded px-3 py-2 bg-white font-sans text-text-dark focus:outline-none focus:border-pink';

export default function FilmForm({ cycleId, initial, onSave }: FilmFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [director, setDirector] = useState(initial?.director ?? '');
  const [year, setYear] = useState(initial ? String(initial.year) : '');
  const [duration, setDuration] = useState(initial?.duration ?? '');
  const [country, setCountry] = useState(initial?.country ?? '');
  const [image, setImage] = useState(initial?.image ?? '');
  const [synopsis, setSynopsis] = useState(initial?.synopsis ?? '');
  const [content, setContent] = useState(initial?.content ?? '');
  const [author, setAuthor] = useState(initial?.author ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        director: director.trim(),
        year: Number(year),
        duration: duration.trim(),
        country: country.trim(),
        image: image || undefined,
        synopsis: synopsis.trim(),
        content: content.trim() || undefined,
        author: author.trim() || undefined,
        cycleId,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg p-8 border border-text-dark/10 max-w-2xl flex flex-col gap-5">
      <label>
        <span className="font-display text-sm text-text-dark">título do filme</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} required className={inputClass} />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label>
          <span className="font-display text-sm text-text-dark">direção</span>
          <input value={director} onChange={(e) => setDirector(e.target.value)} required className={inputClass} />
        </label>
        <label>
          <span className="font-display text-sm text-text-dark">ano</span>
          <input type="number" value={year} onChange={(e) => setYear(e.target.value)} required className={inputClass} />
        </label>
        <label>
          <span className="font-display text-sm text-text-dark">duração (ex.: 117&apos;)</span>
          <input value={duration} onChange={(e) => setDuration(e.target.value)} required className={inputClass} />
        </label>
        <label>
          <span className="font-display text-sm text-text-dark">país</span>
          <input value={country} onChange={(e) => setCountry(e.target.value)} required className={inputClass} />
        </label>
      </div>

      <ImageUploadField label="imagem do filme (fotograma)" value={image} onChange={setImage} />

      <label>
        <span className="font-display text-sm text-text-dark">sinopse</span>
        <textarea value={synopsis} onChange={(e) => setSynopsis(e.target.value)} rows={3} required className={inputClass} />
      </label>

      <label>
        <span className="font-display text-sm text-text-dark">texto sobre o filme (opcional, um parágrafo por linha)</span>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={8} className={inputClass} />
      </label>

      <label>
        <span className="font-display text-sm text-text-dark">autor(a) do texto (opcional)</span>
        <input value={author} onChange={(e) => setAuthor(e.target.value)} className={inputClass} />
      </label>

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
