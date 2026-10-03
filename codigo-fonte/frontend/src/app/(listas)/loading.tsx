import PageShell from '@/components/PageShell';

/** Exibido enquanto a API responde (útil quando o servidor gratuito está "acordando") */
export default function Loading() {
  return (
    <PageShell>
      <div className="animate-pulse" aria-busy="true" aria-live="polite">
        <div className="h-4 w-40 bg-text-dark/10 rounded mb-8" />
        <div className="h-14 w-3/4 max-w-lg bg-text-dark/10 rounded mb-6" />
        <div className="space-y-3 max-w-2xl">
          <div className="h-4 w-full bg-text-dark/10 rounded" />
          <div className="h-4 w-11/12 bg-text-dark/10 rounded" />
          <div className="h-4 w-4/5 bg-text-dark/10 rounded" />
        </div>
        <p className="font-serif italic text-text-dark/50 text-sm mt-10">carregando…</p>
      </div>
    </PageShell>
  );
}
