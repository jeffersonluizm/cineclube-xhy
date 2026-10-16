'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import TelaConexao from '@/components/admin/TelaConexao';
import FormularioSenha from '@/components/admin/FormularioSenha';
import CartaoDemo from '@/components/admin/CartaoDemo';
import { Alerta } from '@/components/admin/ui';
import { destinoSeguro, MOTIVOS } from '@/lib/login';

function Login() {
  const router = useRouter();
  const params = useSearchParams();
  const motivo = params.get('motivo');
  const destino = destinoSeguro(params.get('next'));

  return (
    <TelaConexao titulo="entrar">
      {motivo && MOTIVOS[motivo] && (
        <Alerta tipo={motivo === 'saiu' ? 'sucesso' : 'aviso'} className="w-full">
          {MOTIVOS[motivo]}
        </Alerta>
      )}
      <CartaoDemo aoEntrar={() => router.replace(destino)} />
      <FormularioSenha aoEntrar={() => router.replace(destino)} autoFocus={false} />
      <Link href="/admin/recuperar-senha" className="font-display text-sm text-azul-escuro hover:underline">
        esqueci a senha
      </Link>
    </TelaConexao>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <Login />
    </Suspense>
  );
}
