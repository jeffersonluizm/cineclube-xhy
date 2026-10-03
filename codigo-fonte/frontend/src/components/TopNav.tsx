import Link from 'next/link';
import Logo from './Logo';
import SocialIcons from './SocialIcons';

const navLinks = [
  { label: 'revista', href: '/revista' },
  { label: 'exibições', href: '/ciclos-mostras' },
  { label: 'catálogos', href: '/catalogos' },
  { label: 'sobre', href: '/sobre' },
];

/**
 * Cabeçalho horizontal da página inicial.
 * No celular os links ocupam uma linha própria abaixo do logo e das redes.
 */
export default function TopNav() {
  return (
    <header className="px-5 py-4 sm:px-8 sm:py-6 flex flex-wrap items-center gap-x-5 gap-y-3 sm:gap-x-10 lg:gap-x-16 bg-cream">
      <Logo className="w-12 sm:w-[90px] order-1" />

      <nav
        aria-label="principal"
        className="order-3 basis-full sm:basis-auto sm:order-2 flex flex-wrap gap-x-5 gap-y-1 sm:gap-10 lg:gap-16"
      >
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="font-display font-bold sm:font-normal text-text-dark text-base hover:text-olive hover:underline transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="order-2 sm:order-3 ml-auto shrink-0">
        <SocialIcons size={20} />
      </div>
    </header>
  );
}
