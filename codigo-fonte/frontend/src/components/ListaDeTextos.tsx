import Link from 'next/link';
import { slugAutor } from '@/lib/text';
import type { TextoComEndereco } from '@/lib/types';

const ONDE: Record<TextoComEndereco['parentType'], string> = { revista: 'revista', catalogo: 'catálogo', ciclo: 'exibição' };

/** Textos de lugares diferentes do site (busca, página de autor) com link, autor e trecho */
export default function ListaDeTextos({ textos, mostrarAutor = true }: { textos: TextoComEndereco[]; mostrarAutor?: boolean }) {
  return (
    <ul className="flex flex-col gap-6 max-w-2xl">
      {textos.map((t) => (
        <li key={t._id}>
          <p className="font-display font-bold text-gold-escuro text-xs tracking-widest uppercase mb-1">
            {ONDE[t.parentType]} · {t.column}
          </p>
          <Link href={t.href} className="font-serif italic text-text-dark text-xl leading-snug hover:text-olive-escuro hover:underline">
            {t.title}
          </Link>
          {mostrarAutor && (
            <p className="font-display font-bold text-text-dark text-sm">
              <Link href={`/autores/${slugAutor(t.author)}`} className="hover:underline">
                {t.author}
              </Link>
            </p>
          )}
          {t.trecho && <p className="font-serif text-text-suave text-sm leading-snug mt-1">{t.trecho}</p>}
        </li>
      ))}
    </ul>
  );
}
