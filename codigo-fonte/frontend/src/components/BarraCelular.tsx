'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { linkAtivo, type ItemDoMenu } from '@/lib/menuCelular';

interface BarraCelularProps {
  /** Classe que esconde a barra a partir do tamanho em que a navegação de desktop assume (ex.: md:hidden) */
  classeVisivel: string;
  /** Logo e nome à esquerda da barra */
  marca: React.ReactNode;
  itens: ItemDoMenu[];
  /** Conteúdo no pé da gaveta (redes sociais, sair) */
  extra?: React.ReactNode;
  tom?: 'claro' | 'escuro';
}

/**
 * Navegação do celular: barra fina fixa no topo e um botão que abre a gaveta com os links em
 * linhas de 48px. Fecha ao navegar, com Esc ou no próprio botão; com a gaveta aberta, a página
 * por trás não rola e o foco vai para o primeiro link (e volta ao botão ao fechar).
 */
export default function BarraCelular({ classeVisivel, marca, itens, extra, tom = 'claro' }: BarraCelularProps) {
  const caminho = usePathname() ?? '/';
  const [aberto, setAberto] = useState(false);
  const botaoRef = useRef<HTMLButtonElement>(null);
  const gavetaRef = useRef<HTMLDivElement>(null);
  const escuro = tom === 'escuro';

  // Navegou: fecha
  useEffect(() => setAberto(false), [caminho]);

  useEffect(() => {
    if (!aberto) return;
    const rolagem = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    gavetaRef.current?.querySelector<HTMLElement>('a, button')?.focus();
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setAberto(false);
      botaoRef.current?.focus();
    };
    document.addEventListener('keydown', aoTeclar);
    return () => {
      document.body.style.overflow = rolagem;
      document.removeEventListener('keydown', aoTeclar);
    };
  }, [aberto]);

  const fundo = escuro ? 'bg-dark-purple text-cream border-cream/15' : 'bg-cream text-text-dark border-text-dark/15';
  const linha = escuro ? 'border-cream/15' : 'border-text-dark/10';

  return (
    <header data-barra-celular className={`${classeVisivel} sticky top-0 z-50 border-b ${fundo}`}>
      <div className="h-14 px-4 flex items-center justify-between gap-3">
        {marca}
        <button
          ref={botaoRef}
          type="button"
          onClick={() => setAberto((a) => !a)}
          aria-expanded={aberto}
          aria-controls="menu-celular"
          aria-label={aberto ? 'fechar o menu' : 'abrir o menu'}
          className={`min-w-11 min-h-11 -mr-2 px-2 inline-flex items-center justify-center gap-2 font-display font-bold text-sm ${
            escuro ? 'hover:text-olive' : 'hover:text-olive-escuro'
          }`}
        >
          <span aria-hidden="true">{aberto ? 'fechar' : 'menu'}</span>
          <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true" className="shrink-0">
            {aberto ? (
              <path d="M5 5l12 12M17 5L5 17" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            ) : (
              <path d="M3 6h16M3 11h16M3 16h16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      <div
        id="menu-celular"
        ref={gavetaRef}
        hidden={!aberto}
        className={`fixed inset-x-0 top-14 bottom-0 overflow-y-auto overscroll-contain px-4 pb-8 ${escuro ? 'bg-dark-purple' : 'bg-cream'}`}
      >
        <nav aria-label="menu">
          <ul>
            {itens.map((item) => {
              const atual = linkAtivo(item, caminho);
              const classe = `flex items-center min-h-12 py-3 border-b ${linha} font-display font-bold text-xl ${
                atual ? (escuro ? 'text-pink-claro' : 'text-pink-escuro') : ''
              }`;
              return (
                <li key={item.href}>
                  {item.externo ? (
                    <a href={item.href} target="_blank" rel="noopener" className={classe}>
                      {item.rotulo}
                    </a>
                  ) : (
                    <Link href={item.href} aria-current={atual ? 'page' : undefined} onClick={() => setAberto(false)} className={classe}>
                      {item.rotulo}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
        {extra && <div className="pt-6">{extra}</div>}
      </div>
    </header>
  );
}
