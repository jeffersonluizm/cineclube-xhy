'use client';

import { useRef, useState } from 'react';
import { adminApi, imageUrl } from '@/lib/adminApi';

interface ImageUploadFieldProps {
  label: string;
  value?: string;
  onChange: (url: string) => void;
}

export default function ImageUploadField({ label, value, onChange }: ImageUploadFieldProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleFile(file: File) {
    setError('');
    setUploading(true);
    try {
      const { url } = await adminApi.upload(file);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro no upload');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <span className="font-display text-sm text-text-dark">{label}</span>
      <div className="mt-1 flex items-start gap-4">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl(value)} alt={label} className="w-32 aspect-[3/4] object-cover rounded border border-text-dark/10" />
        ) : (
          <div className="w-32 aspect-[3/4] rounded border-2 border-dashed border-text-dark/20 flex items-center justify-center">
            <span className="font-sans text-xs text-text-dark/40 text-center px-2">sem imagem</span>
          </div>
        )}
        <div className="flex flex-col gap-2">
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
            {uploading ? 'enviando…' : value ? 'trocar imagem' : 'enviar imagem'}
          </button>
          {value && (
            <button type="button" onClick={() => onChange('')} className="font-display text-xs text-pink hover:underline">
              remover
            </button>
          )}
          {error && <p className="font-sans text-xs text-pink">{error}</p>}
        </div>
      </div>
    </div>
  );
}
