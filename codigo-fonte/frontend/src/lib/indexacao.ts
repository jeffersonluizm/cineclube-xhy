import type { MetadataRoute } from 'next';

type Ambiente = Record<string, string | undefined>;

/**
 * O site da demonstração pública (dados de exemplo, editável por qualquer visitante) não
 * deve aparecer nos buscadores. NEXT_PUBLIC_DEMO=1 na Vercel liga o noindex em tudo.
 */
export function siteDeDemonstracao(env: Ambiente = process.env): boolean {
  return ['1', 'true', 'sim'].includes(String(env.NEXT_PUBLIC_DEMO ?? '').toLowerCase());
}

export function robotsDaRaiz(env: Ambiente = process.env) {
  return siteDeDemonstracao(env) ? { index: false, follow: false } : { index: true, follow: true };
}

export function regrasRobots(env: Ambiente = process.env): MetadataRoute.Robots {
  if (siteDeDemonstracao(env)) return { rules: [{ userAgent: '*', disallow: '/' }] };
  const site = env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/admin/', '/api/', '/busca'] }],
    sitemap: `${site}/sitemap.xml`,
  };
}
