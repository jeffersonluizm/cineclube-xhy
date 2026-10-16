import Link from 'next/link';

interface LogoProps {
  /** Largura fixa em px (ignorada quando className define a largura) */
  size?: number;
  /** Classes para largura responsiva, ex.: "w-12 md:w-[90px]" */
  className?: string;
  /** Destino do clique (no painel, o início do painel) */
  href?: string;
  rotulo?: string;
  /** sobre fundo escuro: o desenho tem letras escuras, então ganha uma placa creme */
  placa?: boolean;
}

// Proporção do desenho original (1961,97 × 1825,94)
const RATIO = 1825.94 / 1961.97;

/** Logo vetorial do cineclube (3,5 kB, nítido em qualquer tela) */
export default function Logo({ size = 90, className, href = '/', rotulo = 'Cineclube XHY: página inicial', placa = false }: LogoProps) {
  return (
    <Link
      href={href}
      aria-label={rotulo}
      className={`block shrink-0 ${placa ? 'bg-cream p-1.5' : ''} ${className ?? ''}`}
      style={className ? undefined : { width: size + (placa ? 12 : 0) }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo/logo-xhy.svg" alt="" width={size} height={Math.round(size * RATIO)} className="w-full h-auto" />
    </Link>
  );
}
