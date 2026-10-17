import { api } from '@/lib/api';
import { montarRss } from '@/lib/rss';
import { extrasDoPortfolio } from '@/lib/portfolio';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const revalidate = 600;

/** RSS dos 30 textos mais recentes (só na demonstração de portfólio; no site do cliente, 404) */
export async function GET() {
  if (!extrasDoPortfolio()) return new Response('Não encontrado', { status: 404 });
  const textos = await api.recentes();
  return new Response(montarRss(textos, SITE_URL), {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
