import Logo from './Logo';
import SocialIcons from './SocialIcons';
import NavPrincipal from './NavPrincipal';
import BarraCelularSite from './BarraCelularSite';

/**
 * Navegação das páginas internas.
 *  - md+ : coluna fixa de 160px à esquerda (layout editorial original)
 *  - < md: barra fina fixa no topo com o botão de menu (BarraCelular)
 */
export default function Sidebar() {
  return (
    <>
      {/* Celular / tablet pequeno */}
      <BarraCelularSite />

      {/* Desktop */}
      <aside className="hidden md:flex w-[160px] shrink-0 bg-cream px-6 py-6 flex-col gap-8 min-h-screen sticky top-0 self-start">
        <Logo />
        <NavPrincipal className="flex flex-col gap-4" linkClassName="font-bold text-lg leading-tight" />
        <SocialIcons size={20} className="mt-auto" />
      </aside>
    </>
  );
}
