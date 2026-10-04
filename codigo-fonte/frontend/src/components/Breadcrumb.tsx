import Link from 'next/link';

interface Crumb {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  crumbs: Crumb[];
  /** fundo da página: muda o rosa para a variante com contraste AA */
  tom?: 'cream' | 'dark';
}

export default function Breadcrumb({ crumbs, tom = 'cream' }: BreadcrumbProps) {
  return (
    <nav aria-label="caminho" className={`font-serif italic text-sm mb-6 ${tom === 'dark' ? 'text-pink-claro' : 'text-pink-escuro'}`}>
      <ol className="flex flex-wrap items-baseline gap-y-1">
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <li key={i} className="flex items-baseline">
              {i > 0 && (
                <span aria-hidden="true" className="mx-1">
                  {'>'}
                </span>
              )}
              {crumb.href ? (
                <Link href={crumb.href} className="hover:underline">
                  {crumb.label}
                </Link>
              ) : (
                <span aria-current={isLast ? 'page' : undefined}>{crumb.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
