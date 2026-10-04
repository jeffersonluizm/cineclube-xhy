'use client';

import Link from 'next/link';
import PageShell from '@/components/PageShell';

/**
 * Falha ao montar a página (quase sempre a API fora do ar ou "acordando"). Não é um 404:
 * o conteúdo existe, só não deu para buscá-lo agora.
 */
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <PageShell tone="dark">
      <div role="alert">
        <p className="font-serif italic text-pink-claro text-sm mb-6">serviço indisponível</p>
        <h1 className="font-display font-black text-cream text-titulo-display mb-6">projetor com defeito</h1>
        <p className="font-serif text-cream text-lg leading-relaxed max-w-md mb-4">
          Não conseguimos falar com o servidor agora. A página existe; é uma falha momentânea.
        </p>
        <p className="font-serif text-light-text text-base leading-relaxed max-w-md mb-10">
          Em hospedagem gratuita o servidor dorme quando ninguém visita e leva até um minuto para acordar. Tente de novo em
          instantes.
        </p>
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          <button type="button" onClick={reset} className="font-display font-bold text-olive hover:underline">
            tentar novamente
          </button>
          <Link href="/" className="font-display font-bold text-olive hover:underline">
            ← página inicial
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
