import { NextResponse, type NextRequest } from 'next/server';
import { COTAS, TEXTO_LIMITE, cotaDaRota, criarLimitador, paginaDeLimite, type Cota } from '@/lib/limite';

/**
 * Limite por IP do VISITANTE no site. A API não vê esse IP (quem a chama é o servidor do
 * site, identificado pelo segredo servidor-a-servidor), então é aqui que um visitante
 * abusivo é contido: buscas com termo e a revalidação do cache têm cota menor; o resto, uma
 * cota dimensionada para visitas reais (lib/limite.ts). Nenhum cabeçalho isenta da contagem.
 */
const limitadores: Record<Cota, ReturnType<typeof criarLimitador>> = {
  busca: criarLimitador(COTAS.busca),
  revalidar: criarLimitador(COTAS.revalidar),
  paginas: criarLimitador(COTAS.paginas),
};

function ipDoVisitante(req: NextRequest): string {
  return req.ip ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'desconhecido';
}

export function middleware(req: NextRequest) {
  const caminho = req.nextUrl.pathname;
  // Otimizador de imagens fechado (images.unoptimized): nenhum pedido chega a ele
  if (caminho.startsWith('/_next/image')) return new NextResponse(null, { status: 404 });
  // LIMITE_SITE=0 desliga a contenção por IP (só o teste de carga usa, para medir vazão)
  if (process.env.LIMITE_SITE === '0') return NextResponse.next();
  const cota = cotaDaRota(caminho, req.nextUrl.searchParams);
  if (limitadores[cota](ipDoVisitante(req))) return NextResponse.next();

  const cabecalhos = { 'Retry-After': '60' };
  return caminho.startsWith('/api/')
    ? NextResponse.json({ error: TEXTO_LIMITE }, { status: 429, headers: cabecalhos })
    : new NextResponse(paginaDeLimite(), {
        status: 429,
        headers: { ...cabecalhos, 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
      });
}

export const config = {
  // arquivos estáticos e imagens ficam de fora
  matcher: ['/((?!_next/static|icon.png|apple-icon.png|logo/|icons/|robots.txt).*)'],
};
