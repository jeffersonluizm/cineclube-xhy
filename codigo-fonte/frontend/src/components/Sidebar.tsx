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
 * Navegação das páginas internas.
 *  - md+ : coluna fixa de 160px à esquerda (layout editorial original)
 *  - < md: barra superior compacta com logo, links e redes sociais
 */
export default function Sidebar() {
  return (
    <>
      {/* Celular / tablet pequeno */}
      <header className="md:hidden bg-cream px-5 pt-4 pb-3 flex flex-col gap-3 border-b border-text-dark/10">
        <div className="flex items-center justify-between gap-4">
          <Logo className="w-12" />
          <SocialIcons size={20} />
        </div>
        <nav aria-label="principal" className="flex flex-wrap gap-x-5 gap-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-display font-bold text-text-dark text-base leading-tight hover:text-olive hover:underline transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>

      {/* Desktop */}
      <aside className="hidden md:flex w-[160px] shrink-0 bg-cream px-6 py-6 flex-col gap-8 min-h-screen sticky top-0 self-start">
        <Logo />
        <nav aria-label="principal" className="flex flex-col gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-display font-bold text-text-dark text-lg leading-tight hover:text-olive hover:underline transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <SocialIcons size={20} className="mt-auto" />
      </aside>
    </>
  );
}
