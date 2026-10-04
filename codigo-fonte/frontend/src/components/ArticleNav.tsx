import Link from 'next/link';
import type { Vizinho } from '@/lib/types';

interface ArticleNavProps {
  prev: Vizinho | null;
  next: Vizinho | null;
  basePath: string;
  /** o que está sendo navegado ("texto", "filme") */
  item?: string;
}

/** Próximo e anterior com rótulo escrito (a cor das faixas é só reforço visual) */
export default function ArticleNav({ prev, next, basePath, item = 'texto' }: ArticleNavProps) {
  if (!prev && !next) return null;
  return (
    <nav aria-label={`outros ${item}s`} className="mt-16 pt-8 border-t border-cream/15 flex flex-col gap-4">
      {next && (
        <div className="flex items-center gap-3">
          <span className="w-8 h-5 bg-olive inline-block shrink-0" aria-hidden="true" />
          <Link href={`${basePath}/${next.slug}`} className="font-serif italic text-olive hover:underline text-base">
            <span className="font-display not-italic font-bold text-xs tracking-widest block">PRÓXIMO {item.toUpperCase()}</span>
            {next.title}, por {next.author || next.director}
          </Link>
        </div>
      )}
      {prev && (
        <div className="flex items-center gap-3">
          <span className="w-8 h-5 bg-blue-link inline-block shrink-0" aria-hidden="true" />
          <Link href={`${basePath}/${prev.slug}`} className="font-serif italic text-azul-claro hover:underline text-base">
            <span className="font-display not-italic font-bold text-xs tracking-widest block">{item.toUpperCase()} ANTERIOR</span>
            {prev.title}, por {prev.author || prev.director}
          </Link>
        </div>
      )}
    </nav>
  );
}
