'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';

type TipoToast = 'sucesso' | 'erro';
interface Toast {
  id: number;
  tipo: TipoToast;
  mensagem: string;
}

const Contexto = createContext<(mensagem: string, tipo?: TipoToast) => void>(() => {});

/** Avisos curtos de sucesso ou erro, lidos pelo leitor de tela (no lugar de alert()) */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const proximo = useRef(1);

  const avisar = useCallback((mensagem: string, tipo: TipoToast = 'sucesso') => {
    const id = proximo.current++;
    setToasts((t) => [...t, { id, tipo, mensagem }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), tipo === 'erro' ? 8000 : 4000);
  }, []);

  return (
    <Contexto.Provider value={avisar}>
      {children}
      <div className="fixed bottom-4 right-4 z-[90] flex flex-col gap-2 max-w-sm" role="region" aria-label="avisos">
        <div aria-live="polite" className="flex flex-col gap-2">
          {toasts
            .filter((t) => t.tipo === 'sucesso')
            .map((t) => (
              <p key={t.id} className="bg-text-dark text-cream font-sans text-sm px-4 py-3 border-l-4 border-olive">
                {t.mensagem}
              </p>
            ))}
        </div>
        <div aria-live="assertive" className="flex flex-col gap-2">
          {toasts
            .filter((t) => t.tipo === 'erro')
            .map((t) => (
              <p key={t.id} className="bg-pink-escuro text-white font-sans text-sm px-4 py-3">
                {t.mensagem}
              </p>
            ))}
        </div>
      </div>
    </Contexto.Provider>
  );
}

export const useToast = () => useContext(Contexto);
