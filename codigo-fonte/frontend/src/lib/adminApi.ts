import type { About, Article, Block, Catalog, Cycle, Film, Magazine, Screening, TeamMember } from './types';
import { API_URL, imageUrl } from './media';

export { API_URL, imageUrl };

const TOKEN_KEY = 'xhy_editor_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers, cache: 'no-store' });

  if (res.status === 401 && typeof window !== 'undefined' && !path.startsWith('/api/auth')) {
    clearToken();
    window.location.href = '/admin/login';
    throw new Error('Sessão expirada');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || `Erro ${res.status}`);
  return data as T;
}

export interface ArticleInput {
  title: string;
  author: string;
  column: string;
  epigraph?: string;
  blocks: Block[];
  footnotes: string[];
  coverImage?: string;
  published: boolean;
  parentType: 'revista' | 'catalogo' | 'ciclo';
  parentId: string;
}

export interface MagazineInput {
  number: number;
  volume: number;
  month: string;
  year: number;
  coverImage?: string;
  editorial?: string;
}

export interface CatalogInput {
  title: string;
  year: number;
  coverImage?: string;
  description?: string;
}

export interface CycleInput {
  title: string;
  subtitle?: string;
  year: number;
  coverImage?: string;
  description?: string;
  author?: string;
  authorFootnote?: string;
  epigraph?: string;
  footnotes?: string[];
  screenings: Screening[];
}

export interface AboutInput {
  blocks: Block[];
  team: TeamMember[];
}

export interface FilmInput {
  title: string;
  director: string;
  year: number;
  duration: string;
  country: string;
  image?: string;
  synopsis: string;
  content?: string;
  author?: string;
  authorFootnote?: string;
  epigraph?: string;
  footnotes?: string[];
  cycleId: string;
}

export const adminApi = {
  login: (password: string) =>
    request<{ token: string }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ password }) }),

  upload: (file: File) => {
    const form = new FormData();
    form.append('image', file);
    return request<{ url: string }>('/api/upload', { method: 'POST', body: form });
  },

  revistas: {
    list: () => request<Magazine[]>('/api/admin/revistas'),
    create: (data: MagazineInput) => request<Magazine>('/api/admin/revistas', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<MagazineInput>) =>
      request<Magazine>(`/api/admin/revistas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: string) => request<{ ok: true }>(`/api/admin/revistas/${id}`, { method: 'DELETE' }),
  },

  artigos: {
    list: (parentId?: string) =>
      request<Article[]>(`/api/admin/artigos${parentId ? `?parentId=${parentId}` : ''}`),
    get: (id: string) => request<Article>(`/api/admin/artigos/${id}`),
    create: (data: ArticleInput) => request<Article>('/api/admin/artigos', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<ArticleInput>) =>
      request<Article>(`/api/admin/artigos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: string) => request<{ ok: true }>(`/api/admin/artigos/${id}`, { method: 'DELETE' }),
    reorder: (ids: string[]) =>
      request<{ ok: true }>('/api/admin/artigos/reorder', { method: 'PUT', body: JSON.stringify({ ids }) }),
  },

  catalogos: {
    list: () => request<Catalog[]>('/api/admin/catalogos'),
    create: (data: CatalogInput) => request<Catalog>('/api/admin/catalogos', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<CatalogInput>) =>
      request<Catalog>(`/api/admin/catalogos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: string) => request<{ ok: true }>(`/api/admin/catalogos/${id}`, { method: 'DELETE' }),
  },

  ciclos: {
    list: () => request<Cycle[]>('/api/admin/ciclos'),
    create: (data: CycleInput) => request<Cycle>('/api/admin/ciclos', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<CycleInput>) =>
      request<Cycle>(`/api/admin/ciclos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: string) => request<{ ok: true }>(`/api/admin/ciclos/${id}`, { method: 'DELETE' }),
  },

  filmes: {
    list: (cycleId?: string) => request<Film[]>(`/api/admin/filmes${cycleId ? `?cycleId=${cycleId}` : ''}`),
    get: (id: string) => request<Film>(`/api/admin/filmes/${id}`),
    create: (data: FilmInput) => request<Film>('/api/admin/filmes', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<FilmInput>) =>
      request<Film>(`/api/admin/filmes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: string) => request<{ ok: true }>(`/api/admin/filmes/${id}`, { method: 'DELETE' }),
    reorder: (ids: string[]) =>
      request<{ ok: true }>('/api/admin/filmes/reorder', { method: 'PUT', body: JSON.stringify({ ids }) }),
  },

  sobre: {
    get: () => request<About>('/api/admin/sobre'),
    update: (data: AboutInput) => request<About>('/api/admin/sobre', { method: 'PUT', body: JSON.stringify(data) }),
  },
};
