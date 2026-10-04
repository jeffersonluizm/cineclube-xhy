import type { Metadata } from 'next';
import PainelShell from '@/components/admin/PainelShell';

// O painel nunca entra em buscadores (além do Disallow do robots.txt)
export const metadata: Metadata = {
  title: { default: 'Painel do editor', template: '%s | Painel do editor' },
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <PainelShell>{children}</PainelShell>;
}
