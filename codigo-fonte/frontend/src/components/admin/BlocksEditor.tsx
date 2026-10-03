'use client';

import { useRef, useState } from 'react';
import { adminApi, imageUrl } from '@/lib/adminApi';
import type { Block } from '@/lib/types';

const inputClass =
  'mt-1 w-full border border-text-dark/30 rounded px-3 py-2 bg-white font-sans text-text-dark focus:outline-none focus:border-pink';

const blockLabels: Record<Block['type'], string> = {
  paragraph: 'parágrafo',
  subtitle: 'subtítulo',
  quote: 'citação',
  image: 'imagem',
};

interface BlocksEditorProps {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
  title?: string;
  description?: string;
}

export default function BlocksEditor({
  blocks,
  onChange,
  title = 'corpo do texto',
  description = 'Monte o texto em blocos: escreva parágrafos, intercale imagens onde quiser e use as setas ou arraste (⠿) para reorganizar.',
}: BlocksEditorProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  function moveBlockTo(from: number, to: number) {
    if (from === to) return;
    const next = [...blocks];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  }

  function updateBlock(index: number, patch: Partial<Block>) {
    onChange(blocks.map((b, i) => (i === index ? { ...b, ...patch } : b)));
  }

  function addBlock(index: number, type: Block['type']) {
    const block: Block = type === 'image' ? { type, src: '', align: 'full', width: 'large' } : { type, text: '' };
    const next = [...blocks];
    next.splice(index, 0, block);
    onChange(next);
  }

  function removeBlock(index: number) {
    onChange(blocks.filter((_, i) => i !== index));
  }

  function moveBlock(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div>
      {(title || description) && (
        <div className="mb-4">
          {title && <h2 className="font-display font-bold text-text-dark text-xl mb-1">{title}</h2>}
          {description && <p className="font-sans text-sm text-text-dark/60">{description}</p>}
        </div>
      )}

      <AddBlockBar onAdd={(type) => addBlock(0, type)} />

      {blocks.map((block, i) => (
        <div
          key={i}
          onDragOver={(e) => {
            if (dragIndex === null) return;
            e.preventDefault();
            setOverIndex(i);
          }}
          onDrop={(e) => {
            if (dragIndex === null) return;
            e.preventDefault();
            moveBlockTo(dragIndex, i);
            setDragIndex(null);
            setOverIndex(null);
          }}
        >
          <BlockCard
            block={block}
            index={i}
            total={blocks.length}
            isDragOver={overIndex === i && dragIndex !== null && dragIndex !== i}
            onDragStart={() => setDragIndex(i)}
            onDragEnd={() => {
              setDragIndex(null);
              setOverIndex(null);
            }}
            onChange={(patch) => updateBlock(i, patch)}
            onMove={(dir) => moveBlock(i, dir)}
            onRemove={() => removeBlock(i)}
          />
          <AddBlockBar onAdd={(type) => addBlock(i + 1, type)} />
        </div>
      ))}
    </div>
  );
}

function AddBlockBar({ onAdd }: { onAdd: (type: Block['type']) => void }) {
  return (
    <div className="flex items-center gap-2 py-1.5 opacity-40 hover:opacity-100 transition-opacity">
      <span className="font-sans text-xs text-text-dark/60">inserir:</span>
      {(Object.keys(blockLabels) as Block['type'][]).map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => onAdd(type)}
          className="font-display text-xs text-blue-link border border-blue-link/40 rounded-full px-3 py-0.5 hover:bg-blue-link hover:text-white transition-colors"
        >
          + {blockLabels[type]}
        </button>
      ))}
    </div>
  );
}

interface BlockCardProps {
  block: Block;
  index: number;
  total: number;
  isDragOver: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onChange: (patch: Partial<Block>) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}

function BlockCard({ block, index, total, isDragOver, onDragStart, onDragEnd, onChange, onMove, onRemove }: BlockCardProps) {
  return (
    <div
      className={`bg-white rounded-lg border p-4 flex gap-3 transition-colors ${
        isDragOver ? 'border-olive border-2' : 'border-text-dark/10'
      }`}
    >
      <div className="flex flex-col items-center gap-1 shrink-0">
        <div
          draggable
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = 'move';
            onDragStart();
          }}
          onDragEnd={onDragEnd}
          title="arraste para mover o bloco"
          className="cursor-grab active:cursor-grabbing text-text-dark/40 hover:text-pink select-none leading-none text-lg px-1"
        >
          ⠿
        </div>
        <button
          type="button"
          onClick={() => onMove(-1)}
          disabled={index === 0}
          aria-label="mover bloco para cima"
          className="text-text-dark/50 hover:text-pink disabled:opacity-20 leading-none"
        >
          ▲
        </button>
        <button
          type="button"
          onClick={() => onMove(1)}
          disabled={index === total - 1}
          aria-label="mover bloco para baixo"
          className="text-text-dark/50 hover:text-pink disabled:opacity-20 leading-none"
        >
          ▼
        </button>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center mb-2">
          <span className="font-display text-xs uppercase tracking-wide text-gold">{blockLabels[block.type]}</span>
          <button type="button" onClick={onRemove} aria-label="remover bloco" className="ml-auto text-pink hover:opacity-70">
            ✕
          </button>
        </div>

        {block.type === 'image' ? (
          <ImageBlockFields block={block} onChange={onChange} />
        ) : (
          <textarea
            value={block.text ?? ''}
            onChange={(e) => onChange({ text: e.target.value })}
            rows={block.type === 'subtitle' ? 1 : 4}
            placeholder={
              block.type === 'subtitle'
                ? 'Texto do subtítulo…'
                : block.type === 'quote'
                  ? 'Texto da citação…'
                  : 'Escreva o parágrafo…'
            }
            className={
              inputClass +
              ' mt-0' +
              (block.type === 'subtitle' ? ' font-display font-bold text-lg' : '') +
              (block.type === 'quote' ? ' italic font-serif' : ' font-serif')
            }
          />
        )}
      </div>
    </div>
  );
}

function ImageBlockFields({ block, onChange }: { block: Block; onChange: (patch: Partial<Block>) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  async function handleFile(file: File) {
    setUploadError('');
    setUploading(true);
    try {
      const { url } = await adminApi.upload(file);
      onChange({ src: url });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Erro no upload');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {block.src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl(block.src)} alt={block.caption || 'imagem'} className="max-h-64 rounded object-contain self-start" />
      ) : (
        <div className="border-2 border-dashed border-text-dark/20 rounded p-6 text-center">
          <p className="font-sans text-sm text-text-dark/50 mb-2">Nenhuma imagem selecionada</p>
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = '';
          }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="font-display text-sm bg-blue-link text-white px-4 py-1.5 rounded hover:opacity-90 disabled:opacity-50"
        >
          {uploading ? 'enviando…' : block.src ? 'trocar imagem' : 'enviar imagem'}
        </button>

        <label className="font-sans text-xs text-text-dark/70">
          posição{' '}
          <select
            value={block.align ?? 'full'}
            onChange={(e) => onChange({ align: e.target.value as Block['align'] })}
            className="border border-text-dark/30 rounded px-2 py-1 bg-white"
          >
            <option value="full">largura total</option>
            <option value="center">centralizada</option>
            <option value="left">à esquerda (texto contorna)</option>
            <option value="right">à direita (texto contorna)</option>
          </select>
        </label>

        <label className="font-sans text-xs text-text-dark/70">
          tamanho{' '}
          <select
            value={block.width ?? 'large'}
            onChange={(e) => onChange({ width: e.target.value as Block['width'] })}
            className="border border-text-dark/30 rounded px-2 py-1 bg-white"
          >
            <option value="small">pequeno</option>
            <option value="medium">médio</option>
            <option value="large">grande</option>
          </select>
        </label>
      </div>

      <input
        value={block.caption ?? ''}
        onChange={(e) => onChange({ caption: e.target.value })}
        placeholder="Legenda da imagem (opcional)"
        className={inputClass + ' mt-0'}
      />

      {uploadError && <p className="font-sans text-sm text-pink">{uploadError}</p>}
    </div>
  );
}
