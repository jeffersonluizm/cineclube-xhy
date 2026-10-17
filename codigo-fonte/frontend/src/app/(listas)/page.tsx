import TopNav from '@/components/TopNav';
import BarraCelularSite from '@/components/BarraCelularSite';
import Rodape from '@/components/Rodape';
import ConviteDemo from '@/components/ConviteDemo';
import HomeShowcase, { ShowcaseSlide } from '@/components/HomeShowcase';
import { api } from '@/lib/api';
import type { Catalog } from '@/lib/types';

export default async function HomePage() {
  // Se a API falhar, o error.tsx mostra "serviço indisponível" em vez de uma prateleira vazia
  const { latest, editions } = await api.home();

  const slides: ShowcaseSlide[] = [];

  // Se a última publicação for um catálogo, ele abre a "prateleira"
  if (latest?.type === 'catalogo') {
    const cat = latest.data as Catalog;
    slides.push({
      key: `cat-${cat._id}`,
      type: 'catalogo',
      href: `/catalogos/${cat.slug}`,
      coverImage: cat.coverImage,
      catalog: cat,
      articles: [],
    });
  }

  for (const ed of editions ?? []) {
    slides.push({
      key: `mag-${ed.magazine._id}`,
      type: 'revista',
      href: `/revista/${ed.magazine.number}`,
      coverImage: ed.magazine.coverImage,
      magazine: ed.magazine,
      articles: ed.articles,
    });
  }

  return (
    <div className="bg-cream">
      <BarraCelularSite classeVisivel="sm:hidden" />
      {/* Com edições, a prateleira ocupa a tela (menos a barra do celular); sem elas, o "em breve" fica logo abaixo do topo */}
      <div className={slides.length ? 'h-[calc(100dvh-3.5rem)] sm:h-dvh flex flex-col' : 'flex flex-col'}>
        <TopNav />
        <main id="conteudo" tabIndex={-1} className="flex-1 min-h-0 flex flex-col focus:outline-none">
          <h1 className="sr-only">Cineclube XHY: revista, catálogos e exibições</h1>
          <HomeShowcase slides={slides} />
        </main>
      </div>
      {/* só aparece com a API em modo demonstração */}
      <div className="px-5 sm:px-8 md:px-10">
        <ConviteDemo />
      </div>
      <Rodape />
    </div>
  );
}
