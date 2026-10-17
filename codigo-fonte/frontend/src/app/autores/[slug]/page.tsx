import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PageShell from '@/components/PageShell';
import Breadcrumb from '@/components/Breadcrumb';
import ListaDeTextos from '@/components/ListaDeTextos';
import { api, ouNulo } from '@/lib/api';
import { pageMetadata } from '@/lib/seo';

interface Props {
  params: Promise<{ slug: string }>;
}

const carregar = (slug: string) => ouNulo(api.autor(slug));

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const dados = await carregar(params.slug).catch(() => null);
  if (!dados) return { title: 'Página não encontrada', robots: { index: false } };
  return pageMetadata({
    title: dados.nome,
    description: `Textos de ${dados.nome} no Cineclube XHY: ${dados.textos
      .map((t) => t.title)
      .slice(0, 5)
      .join('; ')}.`,
    path: `/autores/${dados.slug}`,
  });
}

export default async function AutorPage(props: Props) {
  const params = await props.params;
  const dados = await carregar(params.slug);
  if (!dados) notFound();
  const n = dados.textos.length;

  return (
    <PageShell>
      <Breadcrumb crumbs={[{ label: 'autores', href: '/autores' }, { label: dados.nome.toLowerCase() }]} />
      <h1 className="font-display font-black text-text-dark text-titulo-lista mb-2">{dados.nome}</h1>
      <p className="font-serif italic text-text-dark text-lg mb-10">
        {n} {n === 1 ? 'texto publicado' : 'textos publicados'} no cineclube
      </p>
      <ListaDeTextos textos={dados.textos} mostrarAutor={false} />
    </PageShell>
  );
}
