import Sidebar from './Sidebar';
import BackToTop from './BackToTop';
import Rodape from './Rodape';

interface PageShellProps {
  children: React.ReactNode;
  /** cream: listagens e páginas de navegação · dark: leitura de artigos e filmes */
  tone?: 'cream' | 'dark';
  mainClassName?: string;
}

/**
 * Estrutura comum das páginas internas: navegação lateral no desktop, barra superior no
 * celular, conteúdo com respiro proporcional à tela e o rodapé do site.
 */
export default function PageShell({ children, tone = 'cream', mainClassName = '' }: PageShellProps) {
  const escuro = tone === 'dark';
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-cream">
      <Sidebar />

      <div className={`flex-1 min-w-0 flex flex-col ${escuro ? 'bg-dark-purple tom-escuro' : ''}`}>
        <main id="conteudo" tabIndex={-1} className={`flex-1 px-5 py-6 sm:px-8 md:px-10 md:py-8 focus:outline-none ${mainClassName}`}>
          {children}
        </main>
        <Rodape tom={tone} />
      </div>

      <BackToTop />
    </div>
  );
}
