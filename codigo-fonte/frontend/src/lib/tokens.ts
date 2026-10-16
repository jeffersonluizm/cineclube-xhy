/**
 * Tokens de identidade do Cineclube XHY: fonte única das cores e da escala de títulos.
 * O tailwind.config.ts, o CSS global (via theme()) e os metadados do Next leem daqui.
 *
 * As cores de marca vêm do material impresso do cineclube. Rosa, oliva, dourado e azul
 * são claros demais para texto pequeno sobre o creme, então cada um ganhou uma variante
 * "-escuro" (texto sobre creme) e, quando preciso, "-claro" (texto sobre o roxo).
 * A versão original fica para fundos, faixas, ícones e títulos grandes.
 */
export const cores = {
  // superfícies
  cream: '#F2EDD6',
  papel: '#FAF7EA',
  'dark-purple': '#261840',
  white: '#FFFFFF',
  // texto
  'text-dark': '#2B2040',
  'text-suave': '#5A5070',
  // marca (originais)
  pink: '#E8368C',
  olive: '#B5BB38',
  gold: '#C8A030',
  'blue-link': '#6B72B8',
  'light-text': '#9090B8',
  // variantes AA para texto sobre creme
  'pink-escuro': '#C7176C',
  'olive-escuro': '#676B20',
  'gold-escuro': '#7E651E',
  'azul-escuro': '#5860AF',
  'light-escuro': '#63639B',
  // variantes AA para texto pequeno sobre o roxo
  'pink-claro': '#EB4D99',
  'azul-claro': '#8086C2',
  // ícone de terceiros (fundo do ícone do WhatsApp, sem texto)
  whatsapp: '#25D366',
} as const;

export type Cor = keyof typeof cores;

/** Títulos fluidos: [tamanho, altura da linha] (classes text-titulo-*) */
export const escalaTitulos = {
  'titulo-display': ['clamp(3rem, 10vw, 6rem)', '1'],
  'titulo-edicao': ['clamp(3rem, 11vw, 5.5rem)', '1'],
  'titulo-pagina': ['clamp(2.5rem, 9vw, 5.5rem)', '1'],
  'titulo-texto': ['clamp(2.25rem, 7vw, 5rem)', '1'],
  'titulo-lista': ['clamp(2rem, 7vw, 4.5rem)', '1.1'],
  subtitulo: ['clamp(1.25rem, 4vw, 2.2rem)', '1.2'],
} as const;

interface ParDeTexto {
  texto: Cor;
  fundo: Cor;
  uso: string;
  /** texto grande (24px+, ou 18,66px+ em negrito): o mínimo AA é 3:1 */
  grande?: boolean;
}

/** Todo par texto/fundo usado na interface. O teste tokens.test.ts confere o contraste AA de cada um. */
export const PARES_DE_TEXTO: ParDeTexto[] = [
  { texto: 'text-dark', fundo: 'cream', uso: 'corpo e navegação' },
  { texto: 'text-suave', fundo: 'cream', uso: 'textos secundários' },
  { texto: 'text-dark', fundo: 'papel', uso: 'campos do painel' },
  { texto: 'text-suave', fundo: 'papel', uso: 'dicas dos campos' },
  { texto: 'cream', fundo: 'dark-purple', uso: 'leitura' },
  { texto: 'pink-escuro', fundo: 'cream', uso: 'breadcrumb, autor, rótulos, erros' },
  { texto: 'pink-escuro', fundo: 'papel', uso: 'erros nos campos' },
  { texto: 'pink-claro', fundo: 'dark-purple', uso: 'breadcrumb e autor na leitura' },
  { texto: 'olive-escuro', fundo: 'cream', uso: 'links externos, hover, salvo' },
  { texto: 'olive', fundo: 'dark-purple', uso: 'próximo texto, links na leitura' },
  { texto: 'gold-escuro', fundo: 'cream', uso: 'anos, citações, rascunho' },
  { texto: 'gold', fundo: 'dark-purple', uso: 'epígrafe e citação na leitura' },
  { texto: 'azul-escuro', fundo: 'cream', uso: 'direção, e-mails, links do painel' },
  { texto: 'azul-claro', fundo: 'dark-purple', uso: 'ficha do filme, texto anterior' },
  { texto: 'light-escuro', fundo: 'cream', uso: 'epígrafe do ciclo, legendas' },
  { texto: 'light-text', fundo: 'dark-purple', uso: 'notas e legendas na leitura' },
  { texto: 'cream', fundo: 'text-dark', uso: 'botão principal, voltar ao topo' },
  { texto: 'white', fundo: 'pink-escuro', uso: 'botão de excluir, aviso de erro' },
  { texto: 'white', fundo: 'gold-escuro', uso: 'faixa de sessão perto de expirar' },
  { texto: 'cream', fundo: 'dark-purple', uso: 'cabeçalho do painel' },
  { texto: 'pink', fundo: 'cream', uso: 'números grandes de edição', grande: true },
];

function luminancia(hex: string): number {
  const canais = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = canais.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Razão de contraste WCAG 2.x entre duas cores hex (#RRGGBB) */
export function contraste(a: string, b: string): number {
  const [claro, escuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (escuro + 0.05);
}
