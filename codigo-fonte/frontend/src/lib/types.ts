export interface Block {
  type: 'paragraph' | 'subtitle' | 'quote' | 'image';
  text?: string;
  src?: string;
  caption?: string;
  align?: 'full' | 'left' | 'right' | 'center';
  width?: 'small' | 'medium' | 'large';
}

export interface Article {
  _id: string;
  title: string;
  slug: string;
  author: string;
  column: string;
  epigraph?: string;
  content: string;
  blocks?: Block[];
  footnotes?: string[];
  images?: string[];
  coverImage?: string;
  published?: boolean;
  order: number;
  parentType: 'revista' | 'catalogo' | 'ciclo';
  parentId: string;
  createdAt: string;
  updatedAt?: string;
}

/** Texto nas listas públicas (sumário, seções): sem o corpo, com um trecho */
export interface ArticleResumo {
  _id: string;
  title: string;
  slug: string;
  author: string;
  column: string;
  order: number;
  trecho: string;
}

/** Texto com endereço público (busca, autor, recentes) */
export interface TextoComEndereco {
  _id: string;
  title: string;
  slug: string;
  author: string;
  column: string;
  parentType: 'revista' | 'catalogo' | 'ciclo';
  href: string;
  trecho: string;
  createdAt: string;
}

export interface FilmeComEndereco {
  _id: string;
  title: string;
  slug: string;
  director: string;
  year: number;
  href: string;
}

export interface Vizinho {
  title: string;
  slug: string;
  author?: string;
  director?: string;
}

export interface Autor {
  nome: string;
  slug: string;
  textos: number;
}

export interface ResumoPainel {
  contagens: { revistas: number; catalogos: number; ciclos: number; filmes: number; textosPublicados: number; rascunhos: number };
  rascunhos: (Pick<Article, '_id' | 'title' | 'parentType' | 'parentId' | 'published' | 'updatedAt'> & { onde: string })[];
  ultimosEditados: (Pick<Article, '_id' | 'title' | 'parentType' | 'parentId' | 'published' | 'updatedAt'> & { onde: string })[];
}

export interface Magazine {
  _id: string;
  number: number;
  volume: number;
  month: string;
  year: number;
  coverImage?: string;
  editorial?: string;
  slug: string;
  createdAt: string;
}

export interface Catalog {
  _id: string;
  title: string;
  slug: string;
  year: number;
  coverImage?: string;
  description?: string;
  createdAt: string;
}

export interface Screening {
  date: string;
  time: string;
  filmTitle: string;
  /** Página do filme desta sessão; sessões antigas usam só o slug */
  filmId?: string;
  filmSlug?: string;
  director?: string;
  duration?: string;
  country?: string;
}

export interface Cycle {
  _id: string;
  title: string;
  subtitle?: string;
  slug: string;
  year: number;
  coverImage?: string;
  description?: string;
  author?: string;
  authorFootnote?: string;
  epigraph?: string;
  footnotes?: string[];
  screenings: Screening[];
  createdAt: string;
}

export interface Film {
  _id: string;
  title: string;
  slug: string;
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
  order: number;
}

export interface TeamMemberLink {
  label: string;
  url: string;
}

export interface TeamMember {
  name: string;
  role: string;
  email?: string;
  links?: TeamMemberLink[];
}

export interface About {
  _id: string;
  content: string;
  blocks?: Block[];
  team: TeamMember[];
}
