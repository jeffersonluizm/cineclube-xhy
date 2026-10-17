/**
 * Limitador em memória por chave (IP do visitante), janela fixa. Roda no proxy do Next (o antigo middleware):
 * em hospedagem serverless cada instância tem a sua memória, então é uma contenção de
 * melhor esforço; o limite de verdade da API continua valendo para quem a chama direto.
 */
import { cores } from './tokens';

export function criarLimitador({ limite, janelaMs }: { limite: number; janelaMs: number }) {
  const janelas = new Map<string, { inicio: number; usados: number }>();
  return function permitir(chave: string, agora = Date.now()): boolean {
    const atual = janelas.get(chave);
    if (!atual || agora - atual.inicio >= janelaMs) {
      janelas.set(chave, { inicio: agora, usados: 1 });
      if (janelas.size > 10_000) {
        // limpeza simples para a memória não crescer sem fim
        janelas.forEach((v, k) => {
          if (agora - v.inicio >= janelaMs) janelas.delete(k);
        });
      }
      return true;
    }
    atual.usados += 1;
    return atual.usados <= limite;
  };
}

/**
 * Quantas vezes uma página passa pelo proxy: o documento (ou o RSC, na navegação por
 * clique) e os pré-carregamentos (prefetch) dos links visíveis. Medido no Chrome headless em
 * 17/10/2026 com o Next 16, que pré-carrega por segmento e faz mais pedidos (menores), com os
 * dados de demonstração:
 *  - navegação por cliques home → /revista → edição → texto → autores: 46 requisições em
 *    5 páginas, 9,2 por página (no Next 14 eram 6,8; os prefetch já feitos não se repetem);
 *  - abrir uma página do zero: 12 (home no celular) a 31 (home no desktop); no Next 14, 10 a 16.
 * Os cabeçalhos de prefetch e o Purpose: prefetch vêm do cliente, então NADA é isento. A cota
 * de páginas comporta as mesmas 60 páginas por minuto navegando de antes, ou cerca de 19
 * aberturas do zero no desktop.
 */
export const REQUISICOES_POR_VISITA = 10;
const MINUTO = 60_000;
export const COTAS = {
  /** buscas com termo: cada uma consulta a API, que não vê o IP do visitante */
  busca: { limite: 20, janelaMs: MINUTO },
  /** pedidos de revalidação do cache vindos do painel */
  revalidar: { limite: 30, janelaMs: MINUTO },
  paginas: { limite: 60 * REQUISICOES_POR_VISITA, janelaMs: MINUTO },
} as const;

export type Cota = keyof typeof COTAS;

export function cotaDaRota(caminho: string, parametros: URLSearchParams): Cota {
  if (caminho.startsWith('/api/revalidar')) return 'revalidar';
  if (caminho.startsWith('/busca') && parametros.has('q')) return 'busca';
  return 'paginas';
}

export const TEXTO_LIMITE = 'Muitas requisições seguidas. Aguarde um minuto e tente de novo.';

/** Página do 429 na identidade do site, sem recursos externos (o visitante já está sem cota) */
export function paginaDeLimite(): string {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Muitas requisições | Cineclube XHY</title>
<style>
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:${cores.cream};color:${cores['text-dark']};font-family:system-ui,-apple-system,"Segoe UI",sans-serif;padding:16px;box-sizing:border-box}
main{max-width:32rem;border-left:6px solid ${cores['pink-escuro']};padding:8px 0 8px 20px}
p.rotulo{margin:0 0 8px;color:${cores['pink-escuro']};font-style:italic}
h1{margin:0 0 12px;font-size:1.75rem;line-height:1.2;color:${cores['dark-purple']}}
p{line-height:1.5}
a{color:${cores['azul-escuro']}}
</style>
</head>
<body>
<main>
<p class="rotulo">cineclube xhy</p>
<h1>Calma, muitas páginas de uma vez</h1>
<p>${TEXTO_LIMITE}</p>
<p><a href="/">Voltar para a página inicial</a></p>
</main>
</body>
</html>`;
}
