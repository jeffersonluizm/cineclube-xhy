import Link from 'next/link';

interface NavItem {
  title: string;
  slug: string;
  author?: string;
  director?: string;
}

interface ArticleNavProps {
  prev: NavItem | null;
  next: NavItem | null;
  basePath: string;
}

export default function ArticleNav({ prev, next, basePath }: ArticleNavProps) {
  return (
    <div className="mt-16 pt-8 flex flex-col gap-3">
      {next && (
        <div className="flex items-center gap-3">
          <span className="w-8 h-5 bg-olive inline-block" />
          <Link href={`${basePath}/${next.slug}`} className="font-serif italic text-olive hover:underline text-sm">
            [{next.title}], por {next.author || next.director}
          </Link>
        </div>
      )}
      {prev && (
        <div className="flex items-center gap-3">
          <span className="w-8 h-5 bg-blue-link inline-block" />
          <Link href={`${basePath}/${prev.slug}`} className="font-serif italic text-blue-link hover:underline text-sm">
            [{prev.title}], por {prev.author || prev.director}
          </Link>
        </div>
      )}
    </div>
  );
}
