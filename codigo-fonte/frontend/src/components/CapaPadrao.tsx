/**
 * Capa de quem não tem imagem: o título e o logo sobre o roxo do cineclube, no mesmo 3:4 das
 * capas (sem layout pulando). Sem link próprio, para caber dentro de um link de capa.
 */
export default function CapaPadrao({ titulo, className = '' }: { titulo: string; className?: string }) {
  return (
    <div className={`w-full aspect-[3/4] bg-dark-purple flex flex-col justify-between p-[8%] ${className}`} role="img" aria-label={titulo}>
      <span className="block w-[28%] bg-cream p-1.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo/logo-xhy.svg" alt="" className="w-full h-auto" />
      </span>
      <span aria-hidden className="font-display font-black text-cream text-[clamp(1.25rem,4vw,2.5rem)] leading-tight break-words">
        {titulo}
      </span>
    </div>
  );
}
