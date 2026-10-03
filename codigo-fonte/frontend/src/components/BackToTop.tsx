'use client';

import { useEffect, useState } from 'react';

/** Botão "voltar ao topo": aparece só depois de rolar a página */
export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Voltar ao topo"
      tabIndex={visible ? 0 : -1}
      className={`fixed bottom-5 right-5 md:bottom-6 md:right-6 w-11 h-11 md:w-12 md:h-12 bg-text-dark text-cream flex items-center justify-center hover:bg-dark-purple transition-all z-50 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
      }`}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M8 2L2 10H14L8 2Z" fill="currentColor" />
      </svg>
    </button>
  );
}
