import Link from 'next/link';
import { classeBotao } from '@/components/admin/estilos';

export default function PainelNaoEncontrado() {
  return (
    <div className="max-w-xl">
      <p className="font-serif italic text-pink-escuro text-sm mb-2">erro 404</p>
      <h1 className="font-display font-black text-text-dark text-3xl mb-4">não encontramos esta página do painel</h1>
      <p className="font-sans text-text-dark mb-6">O item pode ter sido excluído ou o endereço está incompleto.</p>
      <Link href="/admin" className={classeBotao('principal')}>
        voltar ao início do painel
      </Link>
    </div>
  );
}
