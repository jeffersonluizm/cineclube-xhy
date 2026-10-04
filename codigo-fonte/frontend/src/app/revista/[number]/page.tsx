import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PageShell from '@/components/PageShell';
import Breadcrumb from '@/components/Breadcrumb';
import SumarioSecoes from '@/components/SumarioSecoes';
import Capa from '@/components/Capa';
import { api, ouNulo } from '@/lib/api';
import { excerpt } from '@/lib/text';
import { pageMetadata } from '@/lib/seo';

interface Props {
  params: { number: string };
}

const carregar = (numero: string) => ouNulo(api.revista.get(numero));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const dados = await carregar(params.number).catch(() => null);
  if (!dados) return { title: 'Página não encontrada', robots: { index: false } };
  const { magazine } = dados;
  return pageMetadata({
    title: `Revista XHY n°${magazine.number}`,
    description: magazine.editorial || `Revista XHY, v. ${magazine.volume}, n. ${magazine.number}, ${magazine.month}, ${magazine.year}.`,
    path: `/revista/${magazine.number}`,
    image: magazine.coverImage,
  });
}

export default async function RevistaNumberPage({ params }: Props) {
  const dados = await carregar(params.number);
  if (!dados) notFound();
  const { magazine, columns } = dados;
  const hrefTexto = (t: { slug: string }) => `/revista/${magazine.number}/artigo/${t.slug}`;

  return (
    <PageShell>
      <Breadcrumb crumbs={[{ label: 'revista', href: '/revista' }, { label: `n°${magazine.number}` }]} />

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
        <Capa src={magazine.coverImage} alt={`Capa da Revista XHY n°${magazine.number}`} largura="max-w-[430px]" prioridade />

        {/* Sumário central */}
        <div className="flex-1 min-w-0">
          <h1 className="font-display font-black text-text-dark text-titulo-edicao mb-2">
            <span className="sr-only">Revista XHY </span>n<sup className="font-black text-[0.55em]">o</sup>
            {magazine.number}
          </h1>
          <p className="font-serif italic text-text-dark text-base mb-6 md:mb-8">
            v.{magazine.volume}, {magazine.month}, {magazine.year}
          </p>

          {magazine.editorial && (
            <div className="mb-6">
              <h2 className="font-display font-bold text-text-dark text-sm mb-1">editorial</h2>
              <p className="font-serif italic text-text-suave text-sm leading-snug">{excerpt(magazine.editorial, 160)}</p>
            </div>
          )}

          <SumarioSecoes secoes={columns} hrefTexto={hrefTexto} vazio="Esta edição ainda não tem textos publicados." />
        </div>

        {/* Sumário lateral direita: só em telas largas, onde há espaço para a repetição */}
        <aside className="hidden xl:block w-52 shrink-0" aria-label="sumário rápido">
          <SumarioSecoes secoes={columns} hrefTexto={hrefTexto} compacto nivelTitulo="h3" />
        </aside>
      </div>
    </PageShell>
  );
}
