'use client';

import { useState } from 'react';
import { CycleInput } from '@/lib/adminApi';
import type { Cycle, Film, Screening } from '@/lib/types';
import { filmeDaSessao } from '@/lib/conteudo';
import ImageUploadField from './ImageUploadField';
import CampoNotas from './CampoNotas';
import AvisoSaida from './AvisoSaida';
import { useSujo } from './hooks';
import { Alerta, AreaTexto, BarraSalvar, Botao, Campo, Seletor } from './ui';

interface CycleFormProps {
  initial?: Cycle;
  /** páginas de filme do ciclo, para ligar cada sessão à sua página */
  filmes?: Film[];
  onSave: (data: CycleInput) => Promise<void>;
}

const sessaoVazia: Screening = { date: '', time: '', filmTitle: '', filmId: '', director: '', duration: '', country: '' };

export default function CycleForm({ initial, filmes = [], onSave }: CycleFormProps) {
  const [v, setV] = useState<{
    title: string;
    subtitle: string;
    year: string;
    coverImage: string;
    description: string;
    author: string;
    authorFootnote: string;
    epigraph: string;
    footnotes: string[];
    screenings: Screening[];
  }>({
    title: initial?.title ?? '',
    subtitle: initial?.subtitle ?? '',
    year: initial ? String(initial.year) : String(new Date().getFullYear()),
    coverImage: initial?.coverImage ?? '',
    description: initial?.description ?? '',
    author: initial?.author ?? '',
    authorFootnote: initial?.authorFootnote ?? '',
    epigraph: initial?.epigraph ?? '',
    footnotes: initial?.footnotes ?? [],
    // sessões antigas (só com slug) já aparecem ligadas ao filme certo
    screenings: (initial?.screenings ?? []).map((s) => ({ ...s, filmId: s.filmId || filmeDaSessao(s, filmes)?._id || '' })),
  });
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const { sujo, marcarSalvo } = useSujo(v);
  const alterar = (campo: keyof typeof v) => (e: { target: { value: string } }) => setV((x) => ({ ...x, [campo]: e.target.value }));
  const alterarSessao = (i: number, patch: Partial<Screening>) =>
    setV((x) => ({ ...x, screenings: x.screenings.map((s, j) => (j === i ? { ...s, ...patch } : s)) }));

  /** Ao escolher a página do filme, a sessão herda título e ficha (o editor pode ajustar depois) */
  function escolherFilme(i: number, filmId: string) {
    const f = filmes.find((x) => x._id === filmId);
    alterarSessao(
      i,
      f ? { filmId, filmTitle: `${f.title} (${f.year})`, director: f.director, duration: f.duration, country: f.country } : { filmId: '' }
    );
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setSalvando(true);
    try {
      await onSave({
        title: v.title.trim(),
        subtitle: v.subtitle.trim(),
        year: Number(v.year),
        coverImage: v.coverImage,
        description: v.description.trim(),
        author: v.author.trim(),
        authorFootnote: v.authorFootnote.trim(),
        epigraph: v.epigraph.trim(),
        footnotes: v.footnotes.map((n) => n.trim()).filter(Boolean),
        screenings: v.screenings.filter((s) => s.filmTitle.trim()).map(({ filmSlug: _antigo, ...s }) => ({ ...s, filmId: s.filmId || '' })),
      });
      marcarSalvo();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-5">
      <AvisoSaida sujo={sujo && !salvando} />
      <div className="grid gap-4 md:grid-cols-[1fr,10rem]">
        <Campo rotulo="título" dica="ex.: O Tempo do Depois" value={v.title} onChange={alterar('title')} required />
        <Campo rotulo="ano" type="number" min={1890} max={2100} value={v.year} onChange={alterar('year')} required />
      </div>
      <Campo rotulo="subtítulo" dica="ex.: o cinema de Béla Tarr e Pedro Costa" value={v.subtitle} onChange={alterar('subtitle')} />
      <AreaTexto
        rotulo="texto de apresentação"
        dica="um parágrafo por linha"
        value={v.description}
        onChange={alterar('description')}
        rows={6}
      />
      <ImageUploadField label="foto da exibição" value={v.coverImage} onChange={(url) => setV((x) => ({ ...x, coverImage: url }))} />

      <div className="grid gap-4 md:grid-cols-2">
        <Campo rotulo="autor(a) da apresentação" value={v.author} onChange={alterar('author')} />
        <Campo rotulo="epígrafe" value={v.epigraph} onChange={alterar('epigraph')} />
      </div>
      <AreaTexto
        rotulo="nota sobre o autor(a)"
        dica="vira a nota 1, com chamada ao lado do nome do autor"
        value={v.authorFootnote}
        onChange={alterar('authorFootnote')}
        rows={2}
      />
      <CampoNotas
        titulo="notas da apresentação"
        dica="aparecem na coluna lateral da página da exibição"
        notas={v.footnotes}
        aoMudar={(footnotes) => setV((x) => ({ ...x, footnotes }))}
      />

      {/* Programação */}
      <fieldset className="border-t border-text-dark/20 pt-4">
        <legend className="font-display font-black text-pink-escuro text-sm tracking-widest pr-2">PROGRAMAÇÃO</legend>
        {filmes.length === 0 && (
          <p className="font-sans text-xs text-text-suave mb-3">
            Crie as páginas de filme (seção acima) para poder ligar cada sessão à página do seu filme.
          </p>
        )}

        <ol className="flex flex-col gap-3">
          {v.screenings.map((s, i) => (
            <li key={i} className="border border-text-dark/30 p-4 grid gap-3 md:grid-cols-[6rem,5rem,1fr]">
              <Campo rotulo="data" placeholder="09.03" value={s.date} onChange={(e) => alterarSessao(i, { date: e.target.value })} />
              <Campo rotulo="hora" placeholder="19h" value={s.time} onChange={(e) => alterarSessao(i, { time: e.target.value })} />
              <Seletor
                rotulo="página do filme"
                value={s.filmId ?? ''}
                onChange={(e) => escolherFilme(i, e.target.value)}
                disabled={filmes.length === 0}
              >
                <option value="">sem página (só na programação)</option>
                {filmes.map((f) => (
                  <option key={f._id} value={f._id}>
                    {f.title} ({f.year})
                  </option>
                ))}
              </Seletor>
              <Campo
                className="md:col-span-3"
                rotulo="título na programação"
                placeholder="No Quarto da Vanda (2000)"
                value={s.filmTitle}
                onChange={(e) => alterarSessao(i, { filmTitle: e.target.value })}
              />
              <Campo rotulo="direção" value={s.director ?? ''} onChange={(e) => alterarSessao(i, { director: e.target.value })} />
              <Campo
                rotulo="duração"
                placeholder="117'"
                value={s.duration ?? ''}
                onChange={(e) => alterarSessao(i, { duration: e.target.value })}
              />
              <Campo rotulo="país" value={s.country ?? ''} onChange={(e) => alterarSessao(i, { country: e.target.value })} />
              <div className="md:col-span-3 text-right">
                <Botao
                  variante="texto-perigo"
                  className="text-sm"
                  onClick={() => setV((x) => ({ ...x, screenings: x.screenings.filter((_, j) => j !== i) }))}
                >
                  remover sessão {i + 1}
                </Botao>
              </div>
            </li>
          ))}
        </ol>

        <Botao
          variante="texto"
          className="text-sm mt-3"
          onClick={() => setV((x) => ({ ...x, screenings: [...x.screenings, { ...sessaoVazia }] }))}
        >
          + adicionar sessão
        </Botao>
      </fieldset>

      {erro && <Alerta>{erro}</Alerta>}
      <BarraSalvar salvando={salvando} sujo={initial ? sujo : undefined} rotulo={initial ? 'salvar' : 'criar exibição'} />
    </form>
  );
}
