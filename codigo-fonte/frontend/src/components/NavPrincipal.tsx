'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ativo, LINKS_PRINCIPAIS } from '@/lib/navegacao';

interface NavPrincipalProps {
  className?: string;
  linkClassName?: string;
}

/** Menu principal com a página atual marcada (aria-current e sublinhado) */
export default function NavPrincipal({ className = '', linkClassName = '' }: NavPrincipalProps) {
  const caminho = usePathname() ?? '/';
  return (
    <nav aria-label="principal" className={className}>
      {LINKS_PRINCIPAIS.map((link) => {
        const atual = ativo(link.href, caminho);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={atual ? 'page' : undefined}
            className={`font-display text-text-dark hover:text-olive-escuro hover:underline transition-colors ${
              atual ? 'underline decoration-pink decoration-2 underline-offset-4' : ''
            } ${linkClassName}`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
