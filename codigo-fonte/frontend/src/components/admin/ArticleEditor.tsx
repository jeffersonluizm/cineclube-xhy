'use client';

import { useState } from 'react';
import { ArticleInput } from '@/lib/adminApi';
import BlocksEditor from './BlocksEditor';
import type { Article, Block } from '@/lib/types';

interface ArticleEditorProps {
  parentId: string;
  parentType?: 'revista' | 'catalogo' | 'ciclo';
  initial?: Article;
  onSave: (data: ArticleInput) => Promise<void>;
}

const inputClass =
  'mt-1 w-full border border-text-dark/30 rounded px-3 py-2 bg-white font-sans text-text-dark focus:outline-none focus:border-pink';

export default function ArticleEditor({ parentId, parentType = 'revista', initial, onSave }: ArticleEditorProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [author, setAuthor] = useState(initial?.author ?? '');
  const [column, setColumn] = useState(initial?.column ?? '');
  const [epigraph, setEpigraph] = useState(initial?.epigraph ?? '');
  const [footnotes, setFootnotes] = useState<string[]>(initial?.footnotes ?? []);
  const [published, setPublished] = useState(initial?.published !== false);
  const [blocks, setBlocks] = useState<Block[]>(
    initial?.blocks?.length
      ? initial.blocks
      : initial?.content
        ? initial.content.split('\n').filter(Boolean).map((text) => ({ type: 'paragraph' as const, text }))
        : [{ type: 'paragraph', text: '' }]
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const cleanBlocks = blocks.filter((b) =>
        b.type === 'image' ? Boolean(b.src) : Boolean(b.text?.trim())
      );
      await onSave({
        title: title.trim(),
        author: author.trim(),
        column: column.trim().toLowerCase(),
        epigraph: epigraph.trim() || undefined,
        blocks: cleanBlocks,
        footnotes: footnotes.map((f) => f.trim()).filter(Boolean),
        published,
        parentType,
        parentId,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {/* Metadados */}
      <div className="bg-white rounded-lg p-6 border border-text-dark/10 grid gap-4 md:grid-cols-2">
        <label className="md:col-span-2">
          <span className="font-display text-sm text-text-dark">título</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required className={inputClass} />
        </label>
        <label>
          <span className="font-display text-sm text-text-dark">autor(a)</span>
          <input value={author} onChange={(e) => setAuthor(e.target.value)} required className={inputClass} />
        </label>
        <label>
          <span className="font-display text-sm text-text-dark">coluna / seção (ex.: crítica, ensaio, entrevista)</span>
          <input value={column} onChange={(e) => setColumn(e.target.value)} required className={inputClass} />
        </label>
        <label className="md:col-span-2">
          <span className="font-display text-sm text-text-dark">epígrafe (opcional)</span>
          <textarea value={epigraph} onChange={(e) => setEpigraph(e.target.value)} rows={2} className={inputClass} />
        </label>
        <label className="flex items-center gap-2 md:col-span-2">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
          <span className="font-display text-sm text-text-dark">publicado (desmarque para manter como rascunho)</span>
        </label>
      </div>

      <BlocksEditor
        blocks={blocks}
        onChange={setBlocks}
        title="corpo do artigo"
        description="Monte o texto em blocos: escreva parágrafos, intercale imagens onde quiser e use as setas ou arraste (⠿) para reorganizar."
      />

      {/* Notas de rodapé */}
      <div className="bg-white rounded-lg p-6 border border-text-dark/10">
        <h2 className="font-display font-bold text-text-dark text-lg mb-3">notas de rodapé</h2>
        {footnotes.map((note, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <span className="font-serif text-text-dark/50 pt-2">{i + 1}.</span>
            <textarea
              value={note}
              onChange={(e) => setFootnotes((prev) => prev.map((n, j) => (j === i ? e.target.value : n)))}
              rows={2}
              className={inputClass + ' mt-0'}
            />
            <button
              type="button"
              onClick={() => setFootnotes((prev) => prev.filter((_, j) => j !== i))}
              aria-label="remover nota"
              className="text-pink hover:opacity-70 px-1"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setFootnotes((prev) => [...prev, ''])}
          className="font-display text-sm text-blue-link hover:underline"
        >
          + adicionar nota
        </button>
      </div>

      {error && <p className="font-sans text-pink">{error}</p>}

      <div className="flex items-center gap-4 sticky bottom-0 bg-cream/95 py-4 border-t border-text-dark/10">
        <button
          type="submit"
          disabled={saving}
          className="bg-pink text-white font-display font-bold px-8 py-2.5 rounded hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {saving ? 'salvando…' : initial ? 'salvar alterações' : 'publicar artigo'}
        </button>
      </div>
    </form>
  );
}
