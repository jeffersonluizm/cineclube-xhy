import type { TextoComEndereco } from './types';

const escaparXml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

/** Feed RSS 2.0 dos textos mais recentes (alternativa à newsletter: sem guardar dado pessoal) */
export function montarRss(textos: TextoComEndereco[], siteUrl: string): string {
  const base = siteUrl.replace(/\/$/, '');
  const itens = textos
    .map(
      (t) => `    <item>
      <title>${escaparXml(t.title)}</title>
      <link>${escaparXml(base + t.href)}</link>
      <guid isPermaLink="true">${escaparXml(base + t.href)}</guid>
      <dc:creator>${escaparXml(t.author)}</dc:creator>
      <category>${escaparXml(t.column)}</category>
      <pubDate>${new Date(t.createdAt).toUTCString()}</pubDate>
      <description>${escaparXml(t.trecho)}</description>
    </item>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Cineclube XHY</title>
    <link>${escaparXml(base)}</link>
    <description>Textos da revista, dos catálogos e das exibições do Cineclube XHY.</description>
    <language>pt-BR</language>
    <atom:link href="${escaparXml(base)}/feed.xml" rel="self" type="application/rss+xml" />
${itens}
  </channel>
</rss>
`;
}
