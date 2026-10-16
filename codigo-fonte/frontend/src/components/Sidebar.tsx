import Logo from './Logo';
import SocialIcons from './SocialIcons';
import NavPrincipal from './NavPrincipal';

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
        <NavPrincipal className="flex flex-wrap gap-x-5 gap-y-1" linkClassName="font-bold text-base leading-tight" />
      </header>

      {/* Desktop */}
      <aside className="hidden md:flex w-[160px] shrink-0 bg-cream px-6 py-6 flex-col gap-8 min-h-screen sticky top-0 self-start">
        <Logo />
        <NavPrincipal className="flex flex-col gap-4" linkClassName="font-bold text-lg leading-tight" />
        <SocialIcons size={20} className="mt-auto" />
      </aside>
    </>
  );
}
