'use client';

import { useId, useRef } from 'react';
import { imageUrl } from '@/lib/adminApi';
import { useUploadImagem } from './hooks';
import { Botao } from './ui';

interface ImageUploadFieldProps {
  label: string;
  value?: string;
  onChange: (url: string) => void;
}

/** Campo de imagem (capa, fotograma): envia, mostra a prévia, troca ou remove */
export default function ImageUploadField({ label, value, onChange }: ImageUploadFieldProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { enviar, enviando, erro } = useUploadImagem(onChange);
  const id = useId();

  return (
    <fieldset>
      <legend className="font-display text-sm text-text-dark">{label}</legend>
      <div className="mt-1 flex items-start gap-4">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl(value)} alt={`prévia: ${label}`} className="w-32 aspect-[3/4] object-cover border border-text-dark/30" />
        ) : (
          <div className="w-32 aspect-[3/4] border-2 border-dashed border-text-dark/40 flex items-center justify-center">
            <span className="font-sans text-xs text-text-suave text-center px-2">sem imagem</span>
          </div>
        )}
        <div className="flex flex-col items-start gap-2">
          <input
            ref={fileRef}
            id={id}
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
            {enviando ? 'enviando…' : value ? 'trocar imagem' : 'enviar imagem'}
          </Botao>
          {value && (
            <Botao variante="texto-perigo" onClick={() => onChange('')} className="text-xs">
              remover imagem
            </Botao>
          )}
          <p className="font-sans text-xs text-text-suave">jpg, png, webp, gif ou avif, até 10 MB</p>
          <div aria-live="polite">{erro && <p className="font-sans text-xs text-pink-escuro">{erro}</p>}</div>
        </div>
      </div>
    </fieldset>
  );
}
