'use client';

import Link from 'next/link';
import PageShell from '@/components/PageShell';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <PageShell tone="dark">
      <p className="font-serif italic text-pink text-sm mb-6">algo deu errado</p>
      <h1 className="font-display font-black text-cream leading-none mb-6" style={{ fontSize: 'clamp(3rem, 10vw, 6rem)' }}>
        projetor com defeito
      </h1>
      <p className="font-serif text-cream text-lg leading-relaxed max-w-md mb-10">
        Não conseguimos carregar esta página agora. Pode ser um problema momentâneo de conexão com o servidor.
      </p>
      <div className="flex flex-wrap gap-x-8 gap-y-3">
        <button onClick={reset} className="font-display font-bold text-olive hover:underline">
          tentar novamente
        </button>
        <Link href="/" className="font-display font-bold text-olive hover:underline">
          ← página inicial
        </Link>
      </div>
    </PageShell>
  );
}
