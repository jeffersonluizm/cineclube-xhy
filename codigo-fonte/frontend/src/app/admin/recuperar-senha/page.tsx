import type { Metadata } from 'next';
import Link from 'next/link';
import TelaConexao from '@/components/admin/TelaConexao';

export const metadata: Metadata = { title: 'Esqueci a senha' };

/**
 * Recuperação honesta: o painel tem uma senha única da equipe, guardada como variável de
 * ambiente no servidor. Não há e-mail cadastrado nem link de redefinição para enviar.
 */
export default function RecuperarSenhaPage() {
  return (
    <TelaConexao titulo="esqueci a senha">
      <div className="font-sans text-sm text-text-dark flex flex-col gap-3 w-full">
        <p>
          O painel usa <strong>uma senha só para toda a equipe</strong>. Ela não fica num cadastro de usuários, então não
          existe link de redefinição por e-mail.
        </p>
        <p>
          <strong>Para receber a senha atual</strong>, fale com a coordenação do cineclube pelo grupo da equipe.
        </p>
        <p>
          <strong>Para trocar a senha</strong> (por exemplo, quando alguém sai da equipe), quem administra a hospedagem altera a
          variável <code className="bg-papel px-1">ADMIN_PASSWORD</code> da API e reinicia o serviço. A senha antiga deixa de
          funcionar na hora para novos logins.
        </p>
      </div>
      <Link href="/admin/login" className="font-display text-sm text-azul-escuro hover:underline">
        ← voltar para entrar
      </Link>
    </TelaConexao>
  );
}
