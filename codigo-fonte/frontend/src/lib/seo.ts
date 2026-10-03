import type { Metadata } from 'next';
import { imageUrl } from './media';
import { excerpt } from './text';

interface PageMeta {
  title: string;
  description?: string;
  /** Caminho da página (ex.: /revista/2) — vira a URL canônica */
  path: string;
  /** Imagem de destaque (URL absoluta ou /uploads/…) */
  image?: string;
  type?: 'website' | 'article';
  authors?: string[];
}

/** Monta title/description/Open Graph de uma página a partir do conteúdo vindo da API */
export function pageMetadata({ title, description, path, image, type = 'website', authors }: PageMeta): Metadata {
  const desc = description ? excerpt(description, 180) : undefined;
  const img = image ? imageUrl(image) : undefined;

  return {
    title,
    description: desc,
    alternates: { canonical: path },
    openGraph: {
      title,
      description: desc,
      url: path,
      type,
      ...(img ? { images: [{ url: img, alt: title }] } : {}),
      ...(type === 'article' && authors ? { authors } : {}),
    },
    twitter: {
      card: img ? 'summary_large_image' : 'summary',
      title,
      description: desc,
      ...(img ? { images: [img] } : {}),
    },
  };
}
