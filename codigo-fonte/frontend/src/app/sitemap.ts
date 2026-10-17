import type { MetadataRoute } from 'next';
import { api } from '@/lib/api';
import { extrasDoPortfolio } from '@/lib/portfolio';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const revalidate = 3600;

/** Mapa completo: listas, edições, catálogos, exibições, textos, filmes e autores (via /api/mapa) */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const fixas: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/revista`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/catalogos`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/ciclos-mostras`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/autores`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/sobre`, changeFrequency: 'yearly', priority: 0.5 },
    // "como foi feito" só existe na demonstração de portfólio
    ...(extrasDoPortfolio() ? [{ url: `${SITE_URL}/como-foi-feito`, changeFrequency: 'yearly' as const, priority: 0.3 }] : []),
  ];

  try {
    const paginas = await api.mapa();
    return [
      ...fixas,
      ...paginas.map((p) => ({
        url: `${SITE_URL}${p.href}`,
        lastModified: p.atualizado,
        priority: p.href.split('/').length > 3 ? 0.6 : 0.7,
      })),
    ];
  } catch {
    // API indisponível: devolve só as páginas fixas
    return fixas;
  }
}
