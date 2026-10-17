import type { Metadata } from 'next';
import Link from 'next/link';
import TelaConexao from '@/components/admin/TelaConexao';

export const metadata: Metadata = { title: 'Esqueci a senha' };

/**
 * Recuperação honesta: o painel tem uma senha única da equipe e não há link de redefinição.
 * A página pública não descreve como a senha é guardada nem trocada (isso fica no docs/deploy.md).
 */
export default function RecuperarSenhaPage() {
  return (
    <TelaConexao titulo="esqueci a senha">
      <div className="font-sans text-sm text-text-dark flex flex-col gap-3 w-full">
        <p>
          <strong>Para receber a senha</strong> ou pedir uma nova, fale com a coordenação do cineclube pelo grupo da equipe.
        </p>
      </div>
      <Link href="/admin/login" className="font-display text-sm text-azul-escuro hover:underline">
        ← voltar para entrar
      </Link>
    </TelaConexao>
  );
}
