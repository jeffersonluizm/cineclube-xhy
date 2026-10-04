import Link from 'next/link';
import { excerpt, slugAutor } from '@/lib/text';
import type { ArticleResumo } from '@/lib/types';

interface SumarioSecoesProps {
  secoes: Record<string, ArticleResumo[]>;
  hrefTexto: (texto: ArticleResumo) => string;
  /** compacto: sem trecho e com letras menores (sumário lateral da revista) */
  compacto?: boolean;
  vazio?: string;
  nivelTitulo?: 'h2' | 'h3';
}

/** Sumário agrupado por coluna/seção: revista, catálogo e textos do ciclo */
export default function SumarioSecoes({ secoes, hrefTexto, compacto = false, vazio, nivelTitulo = 'h2' }: SumarioSecoesProps) {
  const entradas = Object.entries(secoes);
  const Titulo = nivelTitulo;
  if (entradas.length === 0) return vazio ? <p className="font-serif italic text-text-dark">{vazio}</p> : null;

  return (
    <>
      {entradas.map(([secao, textos]) => (
        <section key={secao} className={compacto ? 'mb-6' : 'mb-8'}>
          <Titulo className="font-display font-bold text-text-dark text-sm mb-3">{secao}</Titulo>
          <ul>
            {textos.map((t) => (
              <li key={t._id} className={compacto ? 'mb-3' : 'mb-4'}>
                <Link
                  href={hrefTexto(t)}
                  className={`font-serif italic text-text-dark block leading-snug hover:text-olive-escuro hover:underline ${
                    compacto ? 'text-sm' : 'text-base sm:text-sm'
                  }`}
                >
                  {t.title}
                </Link>
                <Link href={`/autores/${slugAutor(t.author)}`} className="font-display font-bold text-text-dark text-xs hover:underline">
                  {t.author}
                </Link>
                {!compacto && t.trecho && (
                  <p className="font-serif italic text-text-suave text-xs leading-snug">{excerpt(t.trecho)}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
