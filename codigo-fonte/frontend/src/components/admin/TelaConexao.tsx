import Link from 'next/link';
import Logo from '@/components/Logo';

/** Moldura das páginas de conexão do painel: fundo roxo, cartão de papel, logo e volta ao site */
export default function TelaConexao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-dark-purple flex flex-col items-center justify-center px-4 py-10">
      <main id="conteudo" className="bg-cream border-2 border-cream w-full max-w-sm px-8 py-10 flex flex-col items-center gap-6">
        <Logo size={96} rotulo="Cineclube XHY: voltar ao site" />
        <div className="w-full text-center">
          <p className="font-serif italic text-pink-escuro text-sm">painel do editor</p>
          <h1 className="font-display font-black text-text-dark text-2xl">{titulo}</h1>
        </div>
        {children}
      </main>
      <Link href="/" className="mt-6 font-display text-cream hover:text-olive hover:underline">
        ← voltar ao site
      </Link>
    </div>
  );
}
