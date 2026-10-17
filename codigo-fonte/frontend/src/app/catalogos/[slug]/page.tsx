import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PageShell from '@/components/PageShell';
import Breadcrumb from '@/components/Breadcrumb';
import SumarioSecoes from '@/components/SumarioSecoes';
import Capa from '@/components/Capa';
import { api, ouNulo } from '@/lib/api';
import { pageMetadata } from '@/lib/seo';

interface Props {
  params: Promise<{ slug: string }>;
}

const carregar = (slug: string) => ouNulo(api.catalogos.get(slug));

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const dados = await carregar(params.slug).catch(() => null);
  if (!dados) return { title: 'Página não encontrada', robots: { index: false } };
  const { catalog } = dados;
  return pageMetadata({
    title: catalog.title,
    description: catalog.description || `Catálogo ${catalog.title} (${catalog.year}) do Cineclube XHY.`,
    path: `/catalogos/${catalog.slug}`,
    image: catalog.coverImage,
  });
}

export default async function CatalogoDetailPage(props: Props) {
  const params = await props.params;
  const dados = await carregar(params.slug);
  if (!dados) notFound();
  const { catalog, sections } = dados;

  return (
    <PageShell>
      <Breadcrumb crumbs={[{ label: 'catálogos', href: '/catalogos' }, { label: catalog.title }]} />

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
        <Capa
          src={catalog.coverImage}
          alt={`Capa do catálogo ${catalog.title}`}
          titulo={catalog.title}
          largura="max-w-[490px]"
          prioridade
        />

        <div className="flex-1 min-w-0">
          <h1 className="font-display font-black text-text-dark text-titulo-lista mb-2">{catalog.title}</h1>
          <p className="font-display font-bold text-gold-escuro mb-6">{catalog.year}</p>
          {catalog.description && (
            <p className="font-serif text-text-dark text-base leading-relaxed mb-8 max-w-md">{catalog.description}</p>
          )}
          <SumarioSecoes
            secoes={sections}
            hrefTexto={(t) => `/catalogos/${catalog.slug}/${t.slug}`}
            vazio="Este catálogo ainda não tem textos publicados."
          />
        </div>
      </div>
    </PageShell>
  );
}
