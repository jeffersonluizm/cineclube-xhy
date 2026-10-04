/** Classes de estilo do painel sem 'use client': servem também a componentes de servidor */

export type Variante = 'principal' | 'secundario' | 'perigo' | 'texto' | 'texto-perigo';

const VARIANTES: Record<Variante, string> = {
  principal: 'bg-text-dark text-cream hover:bg-dark-purple px-5 py-2 font-bold',
  secundario: 'border border-text-dark text-text-dark hover:bg-text-dark hover:text-cream px-5 py-2',
  perigo: 'bg-pink-escuro text-white hover:bg-text-dark px-5 py-2 font-bold',
  texto: 'text-azul-escuro hover:underline',
  'texto-perigo': 'text-pink-escuro hover:underline',
};

export const classeBotao = (variante: Variante = 'principal', extra = '') =>
  `font-display inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTES[variante]} ${extra}`;

