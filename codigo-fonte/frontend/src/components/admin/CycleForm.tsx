'use client';

import { useState } from 'react';
import { CycleInput } from '@/lib/adminApi';
import ImageUploadField from './ImageUploadField';
import type { Cycle, Screening } from '@/lib/types';

interface CycleFormProps {
  initial?: Cycle;
  onSave: (data: CycleInput) => Promise<void>;
}

const inputClass =
  'mt-1 w-full border border-text-dark/30 rounded px-3 py-2 bg-white font-sans text-text-dark focus:outline-none focus:border-pink';

const emptyScreening: Screening = {
  date: '',
  time: '',
  filmTitle: '',
  filmSlug: '',
  director: '',
  duration: '',
  country: '',
};

function toFilmSlug(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\(\d{4}\)/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function CycleForm({ initial, onSave }: CycleFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? '');
  const [year, setYear] = useState(initial ? String(initial.year) : String(new Date().getFullYear()));
  const [coverImage, setCoverImage] = useState(initial?.coverImage ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [author, setAuthor] = useState(initial?.author ?? '');
  const [epigraph, setEpigraph] = useState(initial?.epigraph ?? '');
  const [screenings, setScreenings] = useState<Screening[]>(initial?.screenings ?? []);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function updateScreening(index: number, patch: Partial<Screening>) {
    setScreenings((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        subtitle: subtitle.trim() || undefined,
        year: Number(year),
        coverImage: coverImage || undefined,
        description: description.trim() || undefined,
        author: author.trim() || undefined,
        epigraph: epigraph.trim() || undefined,
        screenings: screenings
          .filter((s) => s.filmTitle.trim())
          .map((s) => ({ ...s, filmSlug: s.filmSlug || toFilmSlug(s.filmTitle) })),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg p-8 border border-text-dark/10 flex flex-col gap-5">
      <div className="grid gap-4 md:grid-cols-[1fr,10rem]">
        <label>
          <span className="font-display text-sm text-text-dark">título (ex.: O Tempo do Depois)</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required className={inputClass} />
        </label>
        <label>
          <span className="font-display text-sm text-text-dark">ano</span>
          <input type="number" value={year} onChange={(e) => setYear(e.target.value)} required className={inputClass} />
        </label>
      </div>

      <label>
        <span className="font-display text-sm text-text-dark">subtítulo (ex.: o cinema de Béla Tarr e Pedro Costa)</span>
        <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className={inputClass} />
      </label>

      <label>
        <span className="font-display text-sm text-text-dark">texto de apresentação (opcional)</span>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} className={inputClass} />
      </label>

      <ImageUploadField label="foto da exibição" value={coverImage} onChange={setCoverImage} />

      <div className="grid gap-4 md:grid-cols-2">
        <label>
          <span className="font-display text-sm text-text-dark">autor(a) da apresentação (opcional)</span>
          <input value={author} onChange={(e) => setAuthor(e.target.value)} className={inputClass} />
        </label>
        <label>
          <span className="font-display text-sm text-text-dark">epígrafe (opcional)</span>
          <input value={epigraph} onChange={(e) => setEpigraph(e.target.value)} className={inputClass} />
        </label>
      </div>

      {/* Programação */}
      <div>
        <h3 className="font-display font-bold text-pink text-sm tracking-widest mb-3">PROGRAMAÇÃO</h3>

        {screenings.map((s, i) => (
          <div key={i} className="border border-text-dark/10 rounded p-4 mb-3 grid gap-3 md:grid-cols-[6rem,5rem,1fr,auto]">
            <label>
              <span className="font-sans text-xs text-text-dark/70">data</span>
              <input value={s.date} onChange={(e) => updateScreening(i, { date: e.target.value })} placeholder="09.03" className={inputClass} />
            </label>
            <label>
              <span className="font-sans text-xs text-text-dark/70">hora</span>
              <input value={s.time} onChange={(e) => updateScreening(i, { time: e.target.value })} placeholder="14h" className={inputClass} />
            </label>
            <label>
              <span className="font-sans text-xs text-text-dark/70">filme</span>
              <input
                value={s.filmTitle}
                onChange={(e) => updateScreening(i, { filmTitle: e.target.value, filmSlug: toFilmSlug(e.target.value) })}
                placeholder="No Quarto de Vanda (2000)"
                className={inputClass}
              />
            </label>
            <button
              type="button"
              onClick={() => setScreenings((prev) => prev.filter((_, j) => j !== i))}
              aria-label="remover sessão"
              className="text-pink hover:opacity-70 self-end pb-2"
            >
              ✕
            </button>
            <label className="md:col-start-1 md:col-span-2">
              <span className="font-sans text-xs text-text-dark/70">direção</span>
              <input value={s.director} onChange={(e) => updateScreening(i, { director: e.target.value })} placeholder="Pedro Costa" className={inputClass} />
            </label>
            <div className="grid grid-cols-2 gap-3 md:col-span-2">
              <label>
                <span className="font-sans text-xs text-text-dark/70">duração</span>
                <input value={s.duration} onChange={(e) => updateScreening(i, { duration: e.target.value })} placeholder="117'" className={inputClass} />
              </label>
              <label>
                <span className="font-sans text-xs text-text-dark/70">país</span>
                <input value={s.country} onChange={(e) => updateScreening(i, { country: e.target.value })} placeholder="Portugal" className={inputClass} />
              </label>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => setScreenings((prev) => [...prev, { ...emptyScreening }])}
          className="font-display text-sm text-blue-link hover:underline"
        >
          + adicionar sessão
        </button>
      </div>

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
