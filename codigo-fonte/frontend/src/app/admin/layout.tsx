'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { getToken, clearToken } from '@/lib/adminApi';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === '/admin/login';
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isLogin && !getToken()) {
      router.replace('/admin/login');
    } else {
      setReady(true);
    }
  }, [isLogin, pathname, router]);

  if (isLogin) return <>{children}</>;
  if (!ready) return null;

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-dark-purple px-4 sm:px-8 py-4 flex flex-wrap items-center gap-x-8 gap-y-3">
        <Logo size={56} />
        <span className="font-display font-bold text-cream text-lg">painel do editor</span>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 sm:ml-8">
          <Link href="/admin" className="font-display text-cream/80 hover:text-olive transition-colors">
            revistas
          </Link>
          <Link href="/admin/catalogos" className="font-display text-cream/80 hover:text-olive transition-colors">
            catálogos
          </Link>
          <Link href="/admin/ciclos" className="font-display text-cream/80 hover:text-olive transition-colors">
            exibições
          </Link>
          <Link href="/admin/sobre" className="font-display text-cream/80 hover:text-olive transition-colors">
            sobre
          </Link>
          <Link href="/" target="_blank" className="font-display text-cream/80 hover:text-olive transition-colors">
            ver o site ↗
          </Link>
        </nav>
        <button
          onClick={() => {
            clearToken();
            router.replace('/admin/login');
          }}
          className="ml-auto font-display text-pink hover:underline"
        >
          sair
        </button>
      </header>
      <main className="max-w-5xl mx-auto px-4 sm:px-8 py-6 sm:py-10">{children}</main>
    </div>
  );
}
