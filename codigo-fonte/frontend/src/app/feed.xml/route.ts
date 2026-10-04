import { api } from '@/lib/api';
import { montarRss } from '@/lib/rss';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const revalidate = 600;

/** RSS dos 30 textos mais recentes: quem quer acompanhar assina sem deixar e-mail */
export async function GET() {
  const textos = await api.recentes();
  return new Response(montarRss(textos, SITE_URL), {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
