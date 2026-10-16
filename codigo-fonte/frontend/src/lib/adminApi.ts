import type { About, Article, Block, Catalog, Cycle, Film, Magazine, ResumoPainel, Screening, TeamMember } from './types';
import { API_URL, imageUrl } from './media';
import { apagarToken, EVENTO_SESSAO_EXPIRADA, guardarToken, lerToken } from './sessao';
import { segundosParaTentarDeNovo } from './login';

export { API_URL, imageUrl };

/** A API recusou o token: o painel abre o re-login por cima da página, sem perder o que foi digitado */
export class ErroSessaoExpirada extends Error {
  constructor() {
    super('Sua sessão expirou. Entre de novo para salvar.');
  }
}

/** Resposta de erro da API com o status HTTP (a mensagem já vem pronta para o editor) */
export class ErroDaApi extends Error {
  constructor(
    mensagem: string,
    public status: number
  ) {
    super(mensagem);
  }
}

/** Item que não existe (apagado) ou endereço malformado: a tela é de "não encontrado", não de falha */
export const ehNaoEncontrado = (e: unknown) => e instanceof ErroDaApi && (e.status === 404 || e.status === 400);

/** Muitas tentativas de login: quanto falta para tentar de novo */
export class ErroLimiteLogin extends Error {
  constructor(
    mensagem: string,
    public segundos: number | null
  ) {
    super(mensagem);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { ...(options.headers as Record<string, string>) };
  if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  const token = lerToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, headers, cache: 'no-store' });
  } catch {
    throw new Error('Não foi possível falar com o servidor. Confira a conexão e tente de novo.');
  }

  if (res.status === 401 && !path.startsWith('/api/auth/login')) {
    apagarToken();
    if (typeof window !== 'undefined') window.dispatchEvent(new Event(EVENTO_SESSAO_EXPIRADA));
    throw new ErroSessaoExpirada();
  }

  const data = await res.json().catch(() => ({}));
  if (res.status === 429) {
    const segundos = segundosParaTentarDeNovo({ ratelimit: res.headers.get('RateLimit'), retryAfter: res.headers.get('Retry-After') });
    throw new ErroLimiteLogin((data as { error?: string }).error || 'Muitas tentativas.', segundos);
  }
  if (!res.ok) throw new ErroDaApi((data as { error?: string }).error || `Erro ${res.status}`, res.status);
  return data as T;
}

/** Avisa o site (Next) para refazer as páginas em cache depois de uma alteração do editor */
async function revalidarSite() {
  try {
    await fetch('/api/revalidar', { method: 'POST', headers: { Authorization: `Bearer ${lerToken() ?? ''}` } });
  } catch {
    /* o cache expira sozinho em até 60 s */
  }
}

/** Escritas do painel: depois de gravar na API, avisa o site para atualizar as páginas */
async function escrever<T>(path: string, options: RequestInit): Promise<T> {
  const resultado = await request<T>(path, options);
  void revalidarSite();
  return resultado;
}

const corpo = (data: unknown) => JSON.stringify(data);

export interface InfoDemo {
  ativo: true;
  papeis: { papel: 'editor'; rotulo: string; descricao: string }[];
  resetMinutos: number;
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

function crud<T, Entrada>(base: string) {
  return {
    list: () => request<T[]>(base),
    get: (id: string) => request<T>(`${base}/${id}`),
    create: (data: Entrada) => escrever<T>(base, { method: 'POST', body: corpo(data) }),
    update: (id: string, data: Partial<Entrada>) => escrever<T>(`${base}/${id}`, { method: 'PUT', body: corpo(data) }),
    remove: (id: string) => escrever<{ ok: true }>(`${base}/${id}`, { method: 'DELETE' }),
  };
}

export const adminApi = {
  async login(password: string) {
    const r = await request<{ token: string; expiraEm: number }>('/api/auth/login', { method: 'POST', body: corpo({ password }) });
    guardarToken(r.token);
    return r;
  },
  sessao: () => request<{ ok: true; expiraEm: number }>('/api/auth/sessao'),

  /** Modo demonstração: null quando desligado (a API responde 404) */
  async demo(): Promise<InfoDemo | null> {
    try {
      return await request<InfoDemo>('/api/demo');
    } catch (e) {
      if (e instanceof ErroDaApi && e.status === 404) return null;
      throw e;
    }
  },
  async entrarDemo(papel: 'editor') {
    const r = await request<{ token: string; expiraEm: number }>('/api/demo/entrar', { method: 'POST', body: corpo({ papel }) });
    guardarToken(r.token);
    return r;
  },

  upload: (file: File) => {
    const form = new FormData();
    form.append('image', file);
    return request<{ url: string }>('/api/upload', { method: 'POST', body: form });
  },

  resumo: () => request<ResumoPainel>('/api/admin/resumo'),

  revistas: {
    ...crud<Magazine, MagazineInput>('/api/admin/revistas'),
    impacto: (id: string) => request<{ textos: number }>(`/api/admin/revistas/${id}/impacto`),
  },
  artigos: {
    ...crud<Article, ArticleInput>('/api/admin/artigos'),
    list: (parentId?: string) => request<Article[]>(`/api/admin/artigos${parentId ? `?parentId=${encodeURIComponent(parentId)}` : ''}`),
    reorder: (ids: string[]) => escrever<{ ok: true }>('/api/admin/artigos/reorder', { method: 'PUT', body: corpo({ ids }) }),
  },
  catalogos: {
    ...crud<Catalog, CatalogInput>('/api/admin/catalogos'),
    impacto: (id: string) => request<{ textos: number }>(`/api/admin/catalogos/${id}/impacto`),
  },
  ciclos: {
    ...crud<Cycle, CycleInput>('/api/admin/ciclos'),
    impacto: (id: string) => request<{ textos: number; filmes: number }>(`/api/admin/ciclos/${id}/impacto`),
  },
  filmes: {
    ...crud<Film, FilmInput>('/api/admin/filmes'),
    list: (cycleId?: string) => request<Film[]>(`/api/admin/filmes${cycleId ? `?cycleId=${encodeURIComponent(cycleId)}` : ''}`),
    reorder: (ids: string[]) => escrever<{ ok: true }>('/api/admin/filmes/reorder', { method: 'PUT', body: corpo({ ids }) }),
  },
  sobre: {
    get: () => request<About>('/api/admin/sobre'),
    update: (data: AboutInput) => escrever<About>('/api/admin/sobre', { method: 'PUT', body: corpo(data) }),
  },
};
