'use client';

import { useCallback, useId, useRef, useState } from 'react';
import { imageUrl } from '@/lib/adminApi';
import type { Block } from '@/lib/types';
import { useUploadImagem } from './hooks';
import { Botao, MoverItem } from './ui';

const campo = 'w-full border border-text-dark/60 bg-papel px-3 py-2 font-sans text-text-dark';

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

/**
 * Editor de texto em blocos (parágrafo, subtítulo, citação, imagem). Reordena arrastando
 * pela alça (⠿) ou, pelo teclado, com as setas de cada bloco.
 */
export default function BlocksEditor({
  blocks,
  onChange,
  title = 'corpo do texto',
  description = 'Monte o texto em blocos: escreva parágrafos, intercale imagens onde quiser e use as setas ou arraste (⠿) para reorganizar.',
}: BlocksEditorProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const idTitulo = useId();

  function moveBlockTo(from: number, to: number) {
    if (from === to) return;
    const next = [...blocks];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  }

  const updateBlock = (index: number, patch: Partial<Block>) => onChange(blocks.map((b, i) => (i === index ? { ...b, ...patch } : b)));

  function addBlock(index: number, type: Block['type']) {
    const block: Block = type === 'image' ? { type, src: '', align: 'full', width: 'large' } : { type, text: '' };
    const next = [...blocks];
    next.splice(index, 0, block);
    onChange(next);
  }

  return (
    <section aria-labelledby={idTitulo}>
      <div className="mb-4">
        <h2 id={idTitulo} className="font-display font-black text-text-dark text-xl mb-1">
          {title}
        </h2>
        {description && <p className="font-sans text-sm text-text-suave">{description}</p>}
      </div>

      <AddBlockBar onAdd={(type) => addBlock(0, type)} posicao="no início" />

      <ol>
        {blocks.map((block, i) => (
          <li
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
            <div
              className={`bg-papel border p-4 flex gap-3 transition-colors ${overIndex === i && dragIndex !== null && dragIndex !== i ? 'border-olive-escuro border-2' : 'border-text-dark/30'}`}
            >
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = 'move';
                    setDragIndex(i);
                  }}
                  onDragEnd={() => {
                    setDragIndex(null);
                    setOverIndex(null);
                  }}
                  title="arraste para mover o bloco"
                  aria-hidden="true"
                  className="cursor-grab active:cursor-grabbing text-text-suave hover:text-pink-escuro select-none leading-none text-lg px-1"
                >
                  ⠿
                </div>
                <MoverItem
                  indice={i}
                  total={blocks.length}
                  rotulo={`bloco ${i + 1} (${blockLabels[block.type]})`}
                  aoMover={(dir) => {
                    const alvo = i + dir;
                    if (alvo >= 0 && alvo < blocks.length) moveBlockTo(i, alvo);
                  }}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center mb-2">
                  <span className="font-display text-xs uppercase tracking-wider text-gold-escuro font-bold">
                    {i + 1}. {blockLabels[block.type]}
                  </span>
                  <button
                    type="button"
                    onClick={() => onChange(blocks.filter((_, j) => j !== i))}
                    aria-label={`remover bloco ${i + 1} (${blockLabels[block.type]})`}
                    className="ml-auto text-pink-escuro hover:text-text-dark px-1"
                  >
                    ✕
                  </button>
                </div>

                {block.type === 'image' ? (
                  <ImageBlockFields block={block} indice={i} onChange={(patch) => updateBlock(i, patch)} />
                ) : (
                  <textarea
                    aria-label={`texto do bloco ${i + 1} (${blockLabels[block.type]})`}
                    value={block.text ?? ''}
                    onChange={(e) => updateBlock(i, { text: e.target.value })}
                    rows={block.type === 'subtitle' ? 1 : 4}
                    placeholder={
                      block.type === 'subtitle'
                        ? 'Texto do subtítulo…'
                        : block.type === 'quote'
                          ? 'Texto da citação…'
                          : 'Escreva o parágrafo…'
                    }
                    className={`${campo} ${block.type === 'subtitle' ? 'font-display font-bold text-lg' : 'font-serif'} ${block.type === 'quote' ? 'italic' : ''}`}
                  />
                )}
              </div>
            </div>
            <AddBlockBar onAdd={(type) => addBlock(i + 1, type)} posicao={`depois do bloco ${i + 1}`} />
          </li>
        ))}
      </ol>
    </section>
  );
}

function AddBlockBar({ onAdd, posicao }: { onAdd: (type: Block['type']) => void; posicao: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2 py-2 opacity-70 hover:opacity-100 focus-within:opacity-100 transition-opacity">
      <span className="font-sans text-xs text-text-suave">inserir {posicao}:</span>
      {(Object.keys(blockLabels) as Block['type'][]).map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => onAdd(type)}
          className="font-display text-xs text-azul-escuro border border-azul-escuro px-3 py-0.5 hover:bg-azul-escuro hover:text-white transition-colors"
        >
          + {blockLabels[type]}
        </button>
      ))}
    </div>
  );
}

function ImageBlockFields({ block, indice, onChange }: { block: Block; indice: number; onChange: (patch: Partial<Block>) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const aoEnviar = useCallback((url: string) => onChange({ src: url }), [onChange]);
  const { enviar, enviando, erro } = useUploadImagem(aoEnviar);
  const id = useId();

  return (
    <div className="flex flex-col gap-3">
      {block.src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl(block.src)}
          alt={block.caption || `imagem do bloco ${indice + 1}`}
          className="max-h-64 object-contain self-start border border-text-dark/20"
        />
      ) : (
        <div className="border-2 border-dashed border-text-dark/40 p-6 text-center">
          <p className="font-sans text-sm text-text-suave">Nenhuma imagem enviada</p>
        </div>
      )}

      <div className="flex items-end gap-3 flex-wrap">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) enviar(file);
            e.target.value = '';
          }}
        />
        <Botao variante="secundario" onClick={() => fileRef.current?.click()} disabled={enviando} className="text-sm px-4 py-1.5">
          {enviando ? 'enviando…' : block.src ? 'trocar imagem' : 'enviar imagem'}
        </Botao>

        <label className="font-sans text-xs text-text-dark flex flex-col">
          posição
          <select
            value={block.align ?? 'full'}
            onChange={(e) => onChange({ align: e.target.value as Block['align'] })}
            className="border border-text-dark/60 px-2 py-1 bg-papel"
          >
            <option value="full">largura total</option>
            <option value="center">centralizada</option>
            <option value="left">à esquerda (texto contorna)</option>
            <option value="right">à direita (texto contorna)</option>
          </select>
        </label>

        <label className="font-sans text-xs text-text-dark flex flex-col">
          tamanho
          <select
            value={block.width ?? 'large'}
            onChange={(e) => onChange({ width: e.target.value as Block['width'] })}
            className="border border-text-dark/60 px-2 py-1 bg-papel"
          >
            <option value="small">pequeno</option>
            <option value="medium">médio</option>
            <option value="large">grande</option>
          </select>
        </label>
      </div>

      <label htmlFor={`${id}-legenda`} className="sr-only">
        legenda da imagem do bloco {indice + 1}
      </label>
      <input
        id={`${id}-legenda`}
        value={block.caption ?? ''}
        onChange={(e) => onChange({ caption: e.target.value })}
        placeholder="Legenda da imagem (também serve de texto alternativo)"
        className={campo}
      />

      <div aria-live="polite">{erro && <p className="font-sans text-sm text-pink-escuro">{erro}</p>}</div>
    </div>
  );
}
