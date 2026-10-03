import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Inter, Nunito } from 'next/font/google';
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
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#F2EDD6',
  width: 'device-width',
  initialScale: 1,
};

// Dá tempo para a API "acordar" em hospedagens gratuitas que hibernam (Render, Koyeb...)
export const maxDuration = 60;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${cormorant.variable} ${nunito.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
