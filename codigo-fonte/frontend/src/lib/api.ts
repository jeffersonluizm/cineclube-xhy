const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function fetcher<T>(path: string): Promise<T> {
  // no-store: o que o editor publica aparece imediatamente no site
  const res = await fetch(`${API_URL}${path}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

export const api = {
  home: () =>
    fetcher<{
      latest: { type: string; data: unknown; articles?: unknown[] } | null;
      editions: { magazine: import('./types').Magazine; articles: import('./types').Article[] }[];
    }>('/api/home'),
  revista: {
    list: () => fetcher<import('./types').Magazine[]>('/api/revista'),
    get: (number: string) => fetcher<{ magazine: import('./types').Magazine; columns: Record<string, import('./types').Article[]> }>(`/api/revista/${number}`),
    article: (number: string, slug: string) =>
      fetcher<{ article: import('./types').Article; magazine: import('./types').Magazine; prev: { title: string; slug: string; author: string } | null; next: { title: string; slug: string; author: string } | null }>(`/api/revista/${number}/artigo/${slug}`),
  },
  catalogos: {
    list: () => fetcher<import('./types').Catalog[]>('/api/catalogos'),
    get: (slug: string) => fetcher<{ catalog: import('./types').Catalog; sections: Record<string, import('./types').Article[]> }>(`/api/catalogos/${slug}`),
    text: (slug: string, textSlug: string) =>
      fetcher<{ article: import('./types').Article; catalog: import('./types').Catalog; prev: { title: string; slug: string; author: string } | null; next: { title: string; slug: string; author: string } | null }>(`/api/catalogos/${slug}/texto/${textSlug}`),
  },
  ciclos: {
    list: () => fetcher<import('./types').Cycle[]>('/api/ciclos'),
    get: (slug: string) =>
      fetcher<{ cycle: import('./types').Cycle; films: import('./types').Film[]; sections: Record<string, import('./types').Article[]> }>(`/api/ciclos/${slug}`),
    film: (slug: string, filmSlug: string) =>
      fetcher<{ film: import('./types').Film; cycle: import('./types').Cycle; prev: { title: string; slug: string; director: string } | null; next: { title: string; slug: string; director: string } | null }>(`/api/ciclos/${slug}/filme/${filmSlug}`),
    text: (slug: string, textSlug: string) =>
      fetcher<{ article: import('./types').Article; cycle: import('./types').Cycle; prev: { title: string; slug: string; author: string } | null; next: { title: string; slug: string; author: string } | null }>(`/api/ciclos/${slug}/texto/${textSlug}`),
  },
  sobre: () => fetcher<import('./types').About>('/api/sobre'),
};
