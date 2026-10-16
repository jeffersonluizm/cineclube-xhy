import Link from 'next/link';
import PageShell from './PageShell';
import Breadcrumb from './Breadcrumb';
import { agruparPorAno } from '@/lib/conteudo';

interface ListaPorAnoProps<T extends { _id: string; year: number }> {
  /** título da página (h1, lido pelo leitor de tela; o visual é o do breadcrumb) */
  titulo: string;
  migalha: string;
  itens: T[];
  href: (item: T) => string;
  /** texto grande do item */
  rotulo: (item: T) => React.ReactNode;
  /** linha de apoio abaixo do item (opcional) */
  detalhe?: (item: T) => React.ReactNode;
  vazio: string;
}

/** Listagens por ano da revista, dos catálogos e das exibições (mesma diagramação nas três) */
export default function ListaPorAno<T extends { _id: string; year: number }>({
  titulo,
  migalha,
  itens,
  href,
  rotulo,
  detalhe,
  vazio,
}: ListaPorAnoProps<T>) {
  return (
    <PageShell>
      <Breadcrumb crumbs={[{ label: migalha }]} />
      <h1 className="sr-only">{titulo}</h1>

      {agruparPorAno(itens).map(([ano, doAno]) => (
        <section key={ano} aria-labelledby={`ano-${ano}`} className="mb-12">
          <h2 id={`ano-${ano}`} className="font-display font-bold text-gold-escuro text-xl mb-2">
            {ano}
          </h2>
          <ul>
            {doAno.map((item) => (
              <li key={item._id} className="mb-4">
                <Link href={href(item)} className="group block">
                  <span className="block font-display font-black text-text-dark text-titulo-lista group-hover:text-olive-escuro group-hover:underline transition-colors">
                    {rotulo(item)}
                  </span>
                  {detalhe && (
                    <span className="font-serif italic text-text-dark text-base group-hover:text-olive-escuro transition-colors">
                      {detalhe(item)}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {itens.length === 0 && <p className="font-serif italic text-text-dark text-lg">{vazio}</p>}
    </PageShell>
  );
}
