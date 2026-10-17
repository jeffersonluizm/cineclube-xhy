import Logo from './Logo';
import SocialIcons from './SocialIcons';
import NavPrincipal from './NavPrincipal';

/**
 * Cabeçalho horizontal da página inicial (sm+). No celular, a home usa a BarraCelularSite,
 * fora da área da prateleira para continuar fixa no topo ao rolar até o rodapé.
 */
export default function TopNav() {
  return (
    <header className="hidden sm:flex px-8 py-6 items-center gap-x-10 lg:gap-x-16 bg-cream">
      <Logo className="w-[90px]" />
      <NavPrincipal className="flex flex-wrap gap-10 lg:gap-16" linkClassName="text-base" />
      <div className="ml-auto shrink-0">
        <SocialIcons size={20} />
      </div>
    </header>
  );
}
