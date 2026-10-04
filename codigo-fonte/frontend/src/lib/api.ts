import type {
  About,
  Article,
  ArticleResumo,
  Autor,
  Catalog,
  Cycle,
  Film,
  FilmeComEndereco,
  Magazine,
  TextoComEndereco,
  Vizinho,
} from './types';
import { unstable_noStore as noStore } from 'next/cache';
import { API_URL } from './media';

/**
 * Cliente da API para as páginas públicas (componentes de servidor).
 *
 * Cache: cada resposta fica guardada pelo Next por até 60 s com a etiqueta "conteudo";
 * quando o editor salva algo no painel, /api/revalidar invalida a etiqueta e a próxima
 * visita já vê a mudança. Assim o site não chama a API a cada visita.
 *
 * Compilação: com a API no ar, as páginas viram estáticas com revalidação (ISR). Sem a API
 * (build local ou numa máquina sem o backend), a página passa a ser renderizada por pedido
 * em vez de quebrar o build; os dados continuam no cache de 60 s.
 *
 * Erros: 404 vira ErroNaoEncontrado (a página responde com o "não encontrado" do site);
 * qualquer outra falha vira ErroApi e sobe para o error.tsx ("serviço indisponível"),
 * em vez de virar uma lista vazia ou um 404 falso.
 */
export const ETIQUETA_CONTEUDO = 'conteudo';
const REVALIDAR_S = 60;

export class ErroNaoEncontrado extends Error {}
export class ErroApi extends Error {}

const NA_COMPILACAO = process.env.NEXT_PHASE === 'phase-production-build';

async function buscar<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { next: { revalidate: REVALIDAR_S, tags: [ETIQUETA_CONTEUDO] } });
  } catch (err) {
    if (NA_COMPILACAO) noStore(); // sem API no build: a rota fica dinâmica em vez de falhar
    throw new ErroApi(`API indisponível em ${path}: ${(err as Error).message}`);
  }
  if (res.status === 404) throw new ErroNaoEncontrado(path);
  if (!res.ok) throw new ErroApi(`API respondeu ${res.status} em ${path}`);
  return res.json() as Promise<T>;
}

/** Converte "não encontrado" em null e deixa os outros erros subirem */
export async function ouNulo<T>(promessa: Promise<T>): Promise<T | null> {
  try {
    return await promessa;
  } catch (err) {
    if (err instanceof ErroNaoEncontrado) return null;
    throw err;
  }
}

type ComVizinhos = { prev: Vizinho | null; next: Vizinho | null };

export const api = {
  home: () =>
    buscar<{
      latest: { type: 'revista' | 'catalogo'; data: Magazine | Catalog; articles?: Article[] } | null;
      editions: { magazine: Magazine; articles: Article[] }[];
    }>('/api/home'),
  revista: {
    list: () => buscar<Magazine[]>('/api/revista'),
    get: (number: string) => buscar<{ magazine: Magazine; columns: Record<string, ArticleResumo[]> }>(`/api/revista/${encodeURIComponent(number)}`),
    article: (number: string, slug: string) =>
      buscar<{ article: Article; magazine: Magazine } & ComVizinhos>(`/api/revista/${encodeURIComponent(number)}/artigo/${encodeURIComponent(slug)}`),
  },
  catalogos: {
    list: () => buscar<Catalog[]>('/api/catalogos'),
    get: (slug: string) => buscar<{ catalog: Catalog; sections: Record<string, ArticleResumo[]> }>(`/api/catalogos/${encodeURIComponent(slug)}`),
    text: (slug: string, textSlug: string) =>
      buscar<{ article: Article; catalog: Catalog } & ComVizinhos>(`/api/catalogos/${encodeURIComponent(slug)}/texto/${encodeURIComponent(textSlug)}`),
  },
  ciclos: {
    list: () => buscar<Cycle[]>('/api/ciclos'),
    get: (slug: string) =>
      buscar<{ cycle: Cycle; films: Film[]; sections: Record<string, ArticleResumo[]> }>(`/api/ciclos/${encodeURIComponent(slug)}`),
    film: (slug: string, filmSlug: string) =>
      buscar<{ film: Film; cycle: Cycle } & ComVizinhos>(`/api/ciclos/${encodeURIComponent(slug)}/filme/${encodeURIComponent(filmSlug)}`),
    text: (slug: string, textSlug: string) =>
      buscar<{ article: Article; cycle: Cycle } & ComVizinhos>(`/api/ciclos/${encodeURIComponent(slug)}/texto/${encodeURIComponent(textSlug)}`),
  },
  sobre: () => buscar<About>('/api/sobre'),
  busca: (termo: string) =>
    buscar<{ termo: string; textos: TextoComEndereco[]; filmes: FilmeComEndereco[] }>(`/api/busca?q=${encodeURIComponent(termo)}`),
  autores: () => buscar<Autor[]>('/api/autores'),
  autor: (slug: string) => buscar<{ nome: string; slug: string; textos: TextoComEndereco[] }>(`/api/autores/${encodeURIComponent(slug)}`),
  recentes: () => buscar<TextoComEndereco[]>('/api/recentes'),
  mapa: () => buscar<{ href: string; atualizado: string }[]>('/api/mapa'),
};
