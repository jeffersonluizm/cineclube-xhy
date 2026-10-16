'use client';

import Link from 'next/link';
import { createContext, useContext } from 'react';

/**
 * A API está em modo demonstração? O layout raiz pergunta uma vez (GET /api/demo, no cache de
 * 60 s) e repassa por contexto, para o rodapé saber, também dentro das telas de erro.
 */
const DemoAtiva = createContext(false);

export function ProvedorDemo({ ativo, children }: { ativo: boolean; children: React.ReactNode }) {
  return <DemoAtiva.Provider value={ativo}>{children}</DemoAtiva.Provider>;
}

/** Link do rodapé para o painel: só existe quando há demonstração para abrir */
export function LinkPainelDemo({ className }: { className: string }) {
  if (!useContext(DemoAtiva)) return null;
  return (
    <li>
      <Link href="/admin/login" className={className}>
        painel do editor (demonstração) →
      </Link>
    </li>
  );
}
