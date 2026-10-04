import Link from 'next/link';
import Image from 'next/image';

interface LogoProps {
  /** Largura fixa em px (ignorada quando className define a largura) */
  size?: number;
  /** Classes para largura responsiva, ex.: "w-12 md:w-[90px]" */
  className?: string;
}

const RATIO = 1827 / 1963;

export default function Logo({ size = 90, className }: LogoProps) {
  return (
    <Link
      href="/"
      aria-label="Cineclube XHY: página inicial"
      className={`block shrink-0 ${className ?? ''}`}
      style={className ? undefined : { width: size }}
    >
      <Image
        src="/logo/logo-xhy.png"
        alt="Cineclube XHY"
        width={size}
        height={Math.round(size * RATIO)}
        className="w-full h-auto"
        priority
      />
    </Link>
  );
}
