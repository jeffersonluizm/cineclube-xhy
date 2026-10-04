'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import TelaConexao from '@/components/admin/TelaConexao';
import FormularioSenha from '@/components/admin/FormularioSenha';
import { destinoSeguro } from '@/lib/login';
import { apagarToken } from '@/lib/sessao';

/** Aberta quando o painel é aberto com a sessão já vencida (ex.: aba esquecida de um dia para o outro) */
function SessaoExpirada() {
  const router = useRouter();
  const destino = destinoSeguro(useSearchParams().get('next'));

  useEffect(() => {
    apagarToken();
  }, []);

  return (
    <TelaConexao titulo="sessão expirada">
      <p className="font-sans text-sm text-text-dark text-center">
        Por segurança, a sessão do painel dura 8 horas. Entre de novo para voltar para onde estava.
      </p>
      <FormularioSenha aoEntrar={() => router.replace(destino)} rotuloBotao="entrar de novo" />
    </TelaConexao>
  );
}

export default function SessaoExpiradaPage() {
  return (
    <Suspense>
      <SessaoExpirada />
    </Suspense>
  );
}
