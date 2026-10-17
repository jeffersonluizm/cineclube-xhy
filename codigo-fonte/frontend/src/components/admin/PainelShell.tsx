'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from '@/components/Logo';
import BarraCelular from '@/components/BarraCelular';
import { linkAtivo, type ItemDoMenu } from '@/lib/menuCelular';
import { ToastProvider } from './Toasts';
import Sessao from './Sessao';

/** Páginas de conexão: abertas sem sessão e sem o cabeçalho do painel */
const PAGINAS_DE_CONEXAO = ['/admin/login', '/admin/recuperar-senha', '/admin/sessao-expirada', '/admin/sair'];

const LINKS: ItemDoMenu[] = [
  { href: '/admin', rotulo: 'início', exato: true },
  { href: '/admin/revistas', rotulo: 'revistas', tambem: ['/admin/artigos'] },
  { href: '/admin/catalogos', rotulo: 'catálogos' },
  { href: '/admin/ciclos', rotulo: 'exibições' },
  { href: '/admin/sobre', rotulo: 'sobre' },
];

/** No celular: as seções, o site em nova aba e, separado no pé da gaveta, o sair */
const ITENS_CELULAR: ItemDoMenu[] = [...LINKS, { href: '/', rotulo: 'ver o site ↗', externo: true }];

/** Casca do painel: cabeçalho roxo com o menu, conteúdo em papel creme e a sessão vigiada */
export default function PainelShell({ children }: { children: React.ReactNode }) {
  const caminho = usePathname() ?? '/admin';

  if (PAGINAS_DE_CONEXAO.some((p) => caminho.startsWith(p))) {
    return <ToastProvider>{children}</ToastProvider>;
  }

  return (
    <ToastProvider>
      <Sessao>
        <div className="min-h-screen bg-cream flex flex-col">
          <BarraCelular
            classeVisivel="md:hidden"
            tom="escuro"
            marca={
              <div className="flex items-center gap-3">
                <Logo size={30} href="/admin" rotulo="Painel do editor: início" placa />
                <p className="font-display font-bold text-cream text-base">painel do editor</p>
              </div>
            }
            itens={ITENS_CELULAR}
            extra={
              <Link
                href="/admin/sair"
                className="inline-flex items-center min-h-12 font-display font-bold text-lg text-pink-claro hover:underline"
              >
                sair
              </Link>
            }
          />
          <header className="hidden md:flex bg-dark-purple px-8 py-4 flex-wrap items-center gap-x-8 gap-y-3">
            <Logo size={44} href="/admin" rotulo="Painel do editor: início" placa />
            <p className="font-display font-bold text-cream text-lg">painel do editor</p>
            <nav aria-label="painel" className="flex flex-wrap gap-x-6 gap-y-2 ml-4">
              {LINKS.map((l) => {
                const atual = linkAtivo(l, caminho);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    aria-current={atual ? 'page' : undefined}
                    className={`font-display text-cream hover:text-olive transition-colors ${atual ? 'underline decoration-pink-claro decoration-2 underline-offset-8' : ''}`}
                  >
                    {l.rotulo}
                  </Link>
                );
              })}
              <a href="/" target="_blank" rel="noopener" className="font-display text-cream hover:text-olive transition-colors">
                ver o site ↗
              </a>
            </nav>
            <Link href="/admin/sair" className="ml-auto font-display text-pink-claro hover:underline">
              sair
            </Link>
          </header>
          <main id="conteudo" tabIndex={-1} className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-8 py-6 sm:py-10 focus:outline-none">
            {children}
          </main>
        </div>
      </Sessao>
    </ToastProvider>
  );
}
