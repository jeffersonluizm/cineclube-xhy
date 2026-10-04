'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from '@/components/Logo';
import { ToastProvider } from './Toasts';
import Sessao from './Sessao';

/** Páginas de conexão: abertas sem sessão e sem o cabeçalho do painel */
const PAGINAS_DE_CONEXAO = ['/admin/login', '/admin/recuperar-senha', '/admin/sessao-expirada', '/admin/sair'];

const LINKS = [
  { href: '/admin', rotulo: 'início', exato: true },
  { href: '/admin/revistas', rotulo: 'revistas' },
  { href: '/admin/catalogos', rotulo: 'catálogos' },
  { href: '/admin/ciclos', rotulo: 'exibições' },
  { href: '/admin/sobre', rotulo: 'sobre' },
];

/** Casca do painel: cabeçalho roxo com o menu, conteúdo em papel creme e a sessão vigiada */
export default function PainelShell({ children }: { children: React.ReactNode }) {
  const caminho = usePathname() ?? '/admin';

  if (PAGINAS_DE_CONEXAO.some((p) => caminho.startsWith(p))) {
    return <ToastProvider>{children}</ToastProvider>;
  }

  const ativo = (href: string, exato?: boolean) =>
    exato ? caminho === href : caminho === href || caminho.startsWith(`${href}/`) || (href === '/admin/revistas' && caminho.startsWith('/admin/artigos'));

  return (
    <ToastProvider>
      <Sessao>
        <div className="min-h-screen bg-cream flex flex-col">
          <header className="bg-dark-purple px-4 sm:px-8 py-4 flex flex-wrap items-center gap-x-8 gap-y-3">
            <Logo size={44} href="/admin" rotulo="Painel do editor: início" placa />
            <p className="font-display font-bold text-cream text-lg">painel do editor</p>
            <nav aria-label="painel" className="flex flex-wrap gap-x-6 gap-y-2 sm:ml-4">
              {LINKS.map((l) => {
                const atual = ativo(l.href, l.exato);
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
