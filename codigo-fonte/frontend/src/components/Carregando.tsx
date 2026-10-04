import PageShell from './PageShell';

/**
 * Esqueleto de carregamento das páginas públicas. Aparece enquanto a API responde
 * (útil quando o servidor gratuito está "acordando", o que leva até um minuto).
 */
export default function Carregando({ tom = 'cream' }: { tom?: 'cream' | 'dark' }) {
  const barra = tom === 'dark' ? 'bg-cream/10' : 'bg-text-dark/10';
  return (
    <PageShell tone={tom}>
      <div role="status" aria-live="polite" className="animate-pulse">
        <div className={`h-4 w-40 rounded mb-8 ${barra}`} />
        <div className={`h-14 w-3/4 max-w-lg rounded mb-6 ${barra}`} />
        <div className="space-y-3 max-w-2xl">
          <div className={`h-4 w-full rounded ${barra}`} />
          <div className={`h-4 w-11/12 rounded ${barra}`} />
          <div className={`h-4 w-4/5 rounded ${barra}`} />
        </div>
        <p className={`font-serif italic text-sm mt-10 ${tom === 'dark' ? 'text-cream' : 'text-text-suave'}`}>
          carregando… se demorar, o servidor pode estar acordando.
        </p>
      </div>
    </PageShell>
  );
}
