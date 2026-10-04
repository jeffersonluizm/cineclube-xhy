'use client';

import { useState } from 'react';
import { FilmInput } from '@/lib/adminApi';
import type { Film } from '@/lib/types';
import ImageUploadField from './ImageUploadField';
import CampoNotas from './CampoNotas';
import AvisoSaida from './AvisoSaida';
import { useSujo } from './hooks';
import { Alerta, AreaTexto, BarraSalvar, Campo } from './ui';

interface FilmFormProps {
  cycleId: string;
  initial?: Film;
  onSave: (data: FilmInput) => Promise<void>;
}

export default function FilmForm({ cycleId, initial, onSave }: FilmFormProps) {
  const [v, setV] = useState({
    title: initial?.title ?? '',
    director: initial?.director ?? '',
    year: initial ? String(initial.year) : '',
    duration: initial?.duration ?? '',
    country: initial?.country ?? '',
    image: initial?.image ?? '',
    synopsis: initial?.synopsis ?? '',
    content: initial?.content ?? '',
    author: initial?.author ?? '',
    authorFootnote: initial?.authorFootnote ?? '',
    epigraph: initial?.epigraph ?? '',
    footnotes: initial?.footnotes ?? [],
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
        title: v.title.trim(),
        director: v.director.trim(),
        year: Number(v.year),
        duration: v.duration.trim(),
        country: v.country.trim(),
        image: v.image,
        synopsis: v.synopsis.trim(),
        content: v.content.trim(),
        author: v.author.trim(),
        authorFootnote: v.authorFootnote.trim(),
        epigraph: v.epigraph.trim(),
        footnotes: v.footnotes.map((n) => n.trim()).filter(Boolean),
        cycleId,
      });
      marcarSalvo();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="max-w-2xl flex flex-col gap-5">
      <AvisoSaida sujo={sujo && !salvando} />
      <Campo rotulo="título do filme" value={v.title} onChange={alterar('title')} required />
      <div className="grid gap-4 md:grid-cols-2">
        <Campo rotulo="direção" value={v.director} onChange={alterar('director')} required />
        <Campo rotulo="ano" type="number" min={1890} max={2100} value={v.year} onChange={alterar('year')} required />
        <Campo rotulo="duração" dica="ex.: 117'" value={v.duration} onChange={alterar('duration')} required />
        <Campo rotulo="país" value={v.country} onChange={alterar('country')} required />
      </div>
      <ImageUploadField label="imagem do filme (fotograma)" value={v.image} onChange={(url) => setV((x) => ({ ...x, image: url }))} />
      <AreaTexto rotulo="sinopse" value={v.synopsis} onChange={alterar('synopsis')} rows={3} required />
      <AreaTexto rotulo="texto sobre o filme" dica="um parágrafo por linha" value={v.content} onChange={alterar('content')} rows={8} />
      <div className="grid gap-4 md:grid-cols-2">
        <Campo rotulo="autor(a) do texto" value={v.author} onChange={alterar('author')} />
        <Campo rotulo="epígrafe" value={v.epigraph} onChange={alterar('epigraph')} />
      </div>
      <AreaTexto
        rotulo="nota sobre o autor(a)"
        dica="vira a nota 1"
        value={v.authorFootnote}
        onChange={alterar('authorFootnote')}
        rows={2}
      />
      <CampoNotas notas={v.footnotes} aoMudar={(footnotes) => setV((x) => ({ ...x, footnotes }))} />
      {erro && <Alerta>{erro}</Alerta>}
      <BarraSalvar salvando={salvando} sujo={initial ? sujo : undefined} rotulo={initial ? 'salvar' : 'criar página do filme'} />
    </form>
  );
}
