import Logo from './Logo';
import SocialIcons from './SocialIcons';
import NavPrincipal from './NavPrincipal';

/**
 * Cabeçalho horizontal da página inicial.
 * No celular os links ocupam uma linha própria abaixo do logo e das redes.
 */
export default function TopNav() {
  return (
    <header className="px-5 py-4 sm:px-8 sm:py-6 flex flex-wrap items-center gap-x-5 gap-y-3 sm:gap-x-10 lg:gap-x-16 bg-cream">
      <Logo className="w-12 sm:w-[90px] order-1" />
      <NavPrincipal
        className="order-3 basis-full sm:basis-auto sm:order-2 flex flex-wrap gap-x-5 gap-y-1 sm:gap-10 lg:gap-16"
        linkClassName="font-bold sm:font-normal text-base"
      />
      <div className="order-2 sm:order-3 ml-auto shrink-0">
        <SocialIcons size={20} />
      </div>
    </header>
  );
}
