import Link from 'next/link';
import PageShell from '@/components/PageShell';

export const metadata = { title: 'Página não encontrada', robots: { index: false } };

export default function NotFound() {
  const link = 'font-display font-bold text-olive hover:underline';
  return (
    <PageShell tone="dark">
      <p className="font-serif italic text-pink-claro text-sm mb-6">erro 404</p>
      <h1 className="font-display font-black text-cream text-titulo-display mb-6">fim da sessão</h1>
      <p className="font-serif text-cream text-lg leading-relaxed max-w-md mb-6">
        A página que você procura não existe ou foi retirada de cartaz.
      </p>
      <form action="/busca" role="search" className="flex flex-wrap gap-3 mb-10 max-w-md">
        <label htmlFor="busca-404" className="sr-only">
          Buscar no site
        </label>
        <input
          id="busca-404"
          name="q"
          type="search"
          minLength={2}
          placeholder="buscar um texto, filme ou autor"
          className="flex-1 min-w-[12rem] bg-cream text-text-dark px-3 py-2 font-sans border border-cream"
        />
        <button type="submit" className="font-display font-bold bg-olive text-dark-purple px-4 py-2 hover:bg-cream">
          buscar
        </button>
      </form>
      <div className="flex flex-wrap gap-x-8 gap-y-3">
        <Link href="/" className={link}>
          ← página inicial
        </Link>
        <Link href="/revista" className={link}>
          revista
        </Link>
        <Link href="/ciclos-mostras" className={link}>
          exibições
        </Link>
        <Link href="/catalogos" className={link}>
          catálogos
        </Link>
      </div>
    </PageShell>
  );
}
