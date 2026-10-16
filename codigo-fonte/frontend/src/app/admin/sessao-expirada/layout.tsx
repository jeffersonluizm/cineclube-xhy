import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Sessão expirada' };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
