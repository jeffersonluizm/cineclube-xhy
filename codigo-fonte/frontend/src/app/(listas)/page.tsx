import TopNav from '@/components/TopNav';
import HomeShowcase, { ShowcaseSlide } from '@/components/HomeShowcase';
import { api } from '@/lib/api';
import { Magazine, Catalog, Article } from '@/lib/types';

export default async function HomePage() {
  let latest: { type: string; data: unknown; articles?: unknown[] } | null = null;
  let editions: { magazine: Magazine; articles: Article[] }[] = [];

  try {
    const res = await api.home();
    latest = res.latest;
    editions = res.editions ?? [];
  } catch {
    // sem dados ainda
  }

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

  for (const ed of editions) {
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
    <div className="h-dvh overflow-hidden bg-cream flex flex-col">
      <TopNav />
      <HomeShowcase slides={slides} />
    </div>
  );
}
