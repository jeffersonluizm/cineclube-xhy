'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialogo } from './Dialogo';
import { Botao } from './ui';

/**
 * Proteção contra perder alterações: fechar a aba ou recarregar mostra o aviso do navegador;
 * clicar num link do painel abre um diálogo próprio perguntando se quer sair sem salvar.
 */
export default function AvisoSaida({ sujo }: { sujo: boolean }) {
  const router = useRouter();
  const [destino, setDestino] = useState<string | null>(null);

  useEffect(() => {
    if (!sujo) return;
    const aoSair = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    const aoClicar = (e: MouseEvent) => {
      const link = (e.target as HTMLElement | null)?.closest('a[href]') as HTMLAnchorElement | null;
      if (!link || link.target === '_blank' || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      if (link.origin !== window.location.origin || link.pathname === window.location.pathname) return;
      e.preventDefault();
      e.stopPropagation();
      setDestino(link.pathname + link.search);
    };
    window.addEventListener('beforeunload', aoSair);
    document.addEventListener('click', aoClicar, true);
    return () => {
      window.removeEventListener('beforeunload', aoSair);
      document.removeEventListener('click', aoClicar, true);
    };
  }, [sujo]);

  return (
    <Dialogo aberto={destino !== null} titulo="Sair sem salvar?" aoFechar={() => setDestino(null)} papel="alertdialog">
      <p className="font-sans text-sm mb-6">Há alterações nesta página que ainda não foram salvas. Se sair agora, elas se perdem.</p>
      <div className="flex flex-wrap gap-3 justify-end">
        <Botao variante="principal" onClick={() => setDestino(null)} autoFocus>
          continuar editando
        </Botao>
        <Botao
          variante="texto-perigo"
          onClick={() => {
            const alvo = destino;
            setDestino(null);
            if (alvo) router.push(alvo);
          }}
        >
          sair sem salvar
        </Botao>
      </div>
    </Dialogo>
  );
}
