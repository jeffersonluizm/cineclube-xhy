import type { MetadataRoute } from 'next';
import { api } from '@/lib/api';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/revista`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/catalogos`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/ciclos-mostras`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/sobre`, changeFrequency: 'yearly', priority: 0.5 },
  ];

  try {
    const [magazines, catalogs, cycles] = await Promise.all([
      api.revista.list(),
      api.catalogos.list(),
      api.ciclos.list(),
    ]);

    for (const m of magazines) {
      entries.push({ url: `${SITE_URL}/revista/${m.number}`, lastModified: m.createdAt, priority: 0.7 });
    }
    for (const c of catalogs) {
      entries.push({ url: `${SITE_URL}/catalogos/${c.slug}`, lastModified: c.createdAt, priority: 0.7 });
    }
    for (const c of cycles) {
      entries.push({ url: `${SITE_URL}/ciclos-mostras/${c.slug}`, lastModified: c.createdAt, priority: 0.7 });
    }
  } catch {
    // API indisponível: devolve só as páginas fixas
  }

  return entries;
}
