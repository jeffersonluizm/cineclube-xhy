import BarraCelular from './BarraCelular';
import Logo from './Logo';
import SocialIcons from './SocialIcons';
import { LINKS_PRINCIPAIS } from '@/lib/navegacao';

const ITENS = LINKS_PRINCIPAIS.map((l) => ({ href: l.href, rotulo: l.label }));

/** Barra do celular do site público: logo, menu com as seções e as redes do cineclube */
export default function BarraCelularSite({ classeVisivel = 'md:hidden' }: { classeVisivel?: string }) {
  return (
    <BarraCelular
      classeVisivel={classeVisivel}
      marca={<Logo className="w-10" />}
      itens={ITENS}
      extra={<SocialIcons size={26} alvoMinimo className="-ml-2.5" />}
    />
  );
}
