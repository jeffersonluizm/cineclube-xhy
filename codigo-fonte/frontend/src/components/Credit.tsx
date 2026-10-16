// Crédito do desenvolvedor do site, exibido na página "sobre" junto da equipe
const DEVELOPER = 'Jefferson Luiz';
const ROLE = 'desenvolvimento do site';
const LINKS = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/j-luiz/' },
  { label: 'GitHub', href: 'https://github.com/jeffersonluizm' },
  { label: 'Letterboxd', href: 'https://letterboxd.com/Weinsmann/' },
];

interface CreditProps {
  className?: string;
}

/** Segue a mesma diagramação dos integrantes da equipe em /sobre */
export default function Credit({ className = '' }: CreditProps) {
  return (
    <section className={`mb-6 ${className}`} aria-label={ROLE}>
      <p className="font-serif text-text-dark text-sm mb-2">{ROLE}</p>
      <div className="mb-4">
        <p className="font-display font-bold text-text-dark text-sm">{DEVELOPER}</p>
        <div className="flex flex-wrap items-center gap-y-1 mt-1">
          {LINKS.map((link, i) => (
            <span key={link.label} className="flex items-center">
              {i > 0 && (
                <span aria-hidden="true" className="text-text-suave text-sm mx-2">
                  ·
                </span>
              )}
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-serif text-sm text-olive-escuro hover:underline"
              >
                {link.label}
              </a>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
