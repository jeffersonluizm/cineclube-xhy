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
  filmSlug: string;
  director: string;
  duration: string;
  country: string;
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

export interface NavItem {
  label: string;
  href: string;
}
