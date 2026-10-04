import { NextResponse, type NextRequest } from 'next/server';
import { contaNoLimite, criarLimitador } from '@/lib/limite';

/**
 * Limite por IP do VISITANTE no site. A API não vê esse IP (quem a chama é o servidor do
 * site, identificado pelo segredo servidor-a-servidor), então é aqui que um visitante
 * abusivo é contido: rotas que sempre consultam a API (busca) e a revalidação do cache
 * têm cota menor; o resto, uma cota folgada.
 */
const MINUTO = 60_000;
const busca = criarLimitador({ limite: 20, janelaMs: MINUTO });
const revalidar = criarLimitador({ limite: 30, janelaMs: MINUTO });
const paginas = criarLimitador({ limite: 300, janelaMs: MINUTO });

function ipDoVisitante(req: NextRequest): string {
  return req.ip ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'desconhecido';
}

export function middleware(req: NextRequest) {
  const caminho = req.nextUrl.pathname;
  // Otimizador de imagens fechado (images.unoptimized): nenhum pedido chega a ele
  if (caminho.startsWith('/_next/image')) return new NextResponse(null, { status: 404 });
  // LIMITE_SITE=0 desliga a contenção por IP (só o teste de carga usa, para medir vazão)
  if (process.env.LIMITE_SITE === '0') return NextResponse.next();
  // Pré-carregamento de links não é visita: não gasta a cota (a home pré-carrega dezenas de links)
  if (!contaNoLimite(req.headers)) return NextResponse.next();
  const ip = ipDoVisitante(req);
  const permitido = caminho.startsWith('/api/revalidar') ? revalidar(ip) : caminho.startsWith('/busca') ? busca(ip) : paginas(ip);
  if (permitido) return NextResponse.next();

  const texto = 'Muitas requisições seguidas. Aguarde um minuto e tente de novo.';
  return caminho.startsWith('/api/')
    ? NextResponse.json({ error: texto }, { status: 429, headers: { 'Retry-After': '60' } })
    : new NextResponse(texto, { status: 429, headers: { 'Retry-After': '60', 'Content-Type': 'text/plain; charset=utf-8' } });
}

export const config = {
  // arquivos estáticos e imagens ficam de fora
  matcher: ['/((?!_next/static|icon.png|apple-icon.png|logo/|icons/|robots.txt).*)'],
};
