import Link from 'next/link';
import PageShell from '@/components/PageShell';

export const metadata = { title: 'Página não encontrada' };

export default function NotFound() {
  return (
    <PageShell tone="dark">
      <p className="font-serif italic text-pink text-sm mb-6">erro 404</p>
      <h1 className="font-display font-black text-cream leading-none mb-6" style={{ fontSize: 'clamp(3rem, 10vw, 6rem)' }}>
        fim da sessão
      </h1>
      <p className="font-serif text-cream text-lg leading-relaxed max-w-md mb-10">
        A página que você procura não existe ou foi retirada de cartaz.
      </p>
      <div className="flex flex-wrap gap-x-8 gap-y-3">
        <Link href="/" className="font-display font-bold text-olive hover:underline">
          ← página inicial
        </Link>
        <Link href="/revista" className="font-display font-bold text-olive hover:underline">
          revista
        </Link>
        <Link href="/ciclos-mostras" className="font-display font-bold text-olive hover:underline">
          exibições
        </Link>
        <Link href="/catalogos" className="font-display font-bold text-olive hover:underline">
          catálogos
        </Link>
      </div>
    </PageShell>
  );
}
