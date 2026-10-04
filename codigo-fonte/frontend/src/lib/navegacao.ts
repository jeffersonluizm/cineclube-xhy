/** Navegação e canais do cineclube: uma lista só para menu lateral, cabeçalho da home e rodapé */

export const LINKS_PRINCIPAIS = [
  { label: 'revista', href: '/revista' },
  { label: 'exibições', href: '/ciclos-mostras' },
  { label: 'catálogos', href: '/catalogos' },
  { label: 'sobre', href: '/sobre' },
  { label: 'busca', href: '/busca' },
] as const;

export interface Rede {
  label: string;
  href: string;
  icon: string;
  /** ícone claro que precisa de fundo escuro */
  badge?: 'black';
}

export const REDES: Rede[] = [
  { label: 'Instagram', href: 'https://www.instagram.com/cinexhy247/', icon: '/icons/insta1.png' },
  { label: 'Letterboxd', href: 'https://boxd.it/b9dkB', icon: '/icons/letterboxd.png', badge: 'black' },
  { label: 'YouTube', href: 'https://www.youtube.com/@XHY-247', icon: '/icons/youtube.png' },
];

export const WHATSAPP = {
  label: 'grupo do WhatsApp',
  href: 'https://chat.whatsapp.com/Ff9RsOUNBlfG401g5LhkYi',
};

/** O link está ativo na página atual ou em uma página dentro dele */
export const ativo = (href: string, caminho: string) => caminho === href || caminho.startsWith(`${href}/`);
