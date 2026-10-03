import Sidebar from './Sidebar';
import BackToTop from './BackToTop';

interface PageShellProps {
  children: React.ReactNode;
  /** cream: listagens e páginas de navegação · dark: leitura de artigos e filmes */
  tone?: 'cream' | 'dark';
  mainClassName?: string;
}

/**
 * Estrutura comum das páginas internas: navegação lateral no desktop,
 * barra superior no celular, e área de conteúdo com respiro proporcional à tela.
 */
export default function PageShell({ children, tone = 'cream', mainClassName = '' }: PageShellProps) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-cream">
      <Sidebar />

      <main
        className={`flex-1 min-w-0 px-5 py-6 sm:px-8 md:px-10 md:py-8 ${
          tone === 'dark' ? 'bg-dark-purple md:min-h-screen' : ''
        } ${mainClassName}`}
      >
        {children}
      </main>

      <BackToTop />
    </div>
  );
}
