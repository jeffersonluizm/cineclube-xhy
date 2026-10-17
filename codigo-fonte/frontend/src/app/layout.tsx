import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Inter, Nunito } from 'next/font/google';
import { cores } from '@/lib/tokens';
import { robotsDaRaiz } from '@/lib/indexacao';
import { extrasDoPortfolio } from '@/lib/portfolio';
import { api, ouNulo } from '@/lib/api';
import { ProvedorDemo } from '@/components/DemoContexto';
import './globals.css';

// Fontes self-hosted pelo Next: sem requisição externa ao Google e sem "piscar" de fonte
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-sans',
  display: 'swap',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const SITE_NAME = 'Cineclube XHY';
const SITE_DESCRIPTION = 'Revista, catálogos e exibições do Cineclube XHY.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  // RSS só na demonstração de portfólio
  ...(extrasDoPortfolio()
    ? { alternates: { types: { 'application/rss+xml': [{ url: '/feed.xml', title: 'Textos do Cineclube XHY' }] } } }
    : {}),
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [{ url: '/logo/logo-xhy.png', width: 1963, height: 1827, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  // NEXT_PUBLIC_DEMO=1 (site da demonstração): noindex em tudo
  robots: robotsDaRaiz(),
};

export const viewport: Viewport = {
  themeColor: cores.cream,
  width: 'device-width',
  initialScale: 1,
};

// Dá tempo para a API "acordar" em hospedagens gratuitas que hibernam (Render, Koyeb...)
export const maxDuration = 60;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Demonstração ligada na API? (fora do ar ou desligada: sem link do painel no rodapé)
  const demo = await ouNulo(api.demo()).catch(() => null);
  return (
    // data-scroll-behavior: o Next 16 só desliga o scroll suave (globals.css) durante a troca de
    // página com este atributo; sem ele, cada navegação rolaria devagar até o topo
    <html lang="pt-BR" data-scroll-behavior="smooth" className={`${cormorant.variable} ${nunito.variable} ${inter.variable}`}>
      <body>
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:bg-text-dark focus:text-cream focus:px-4 focus:py-2 font-display font-bold"
        >
          pular para o conteúdo
        </a>
        <ProvedorDemo ativo={Boolean(demo)}>{children}</ProvedorDemo>
      </body>
    </html>
  );
}
