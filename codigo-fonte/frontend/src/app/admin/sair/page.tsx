'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import TelaConexao from '@/components/admin/TelaConexao';
import { apagarRascunhos, apagarToken } from '@/lib/sessao';
import { classeBotao } from '@/components/admin/ui';

/** Sair: apaga o token deste navegador e confirma, com caminhos de volta */
export default function SairPage() {
  const [saiu, setSaiu] = useState(false);

  useEffect(() => {
    apagarToken();
    try {
      apagarRascunhos();
    } catch {
      /* sem armazenamento: nada a apagar */
    }
    setSaiu(true);
  }, []);

  return (
    <TelaConexao titulo="você saiu">
      <p role="status" className="font-sans text-sm text-text-dark text-center">
        {saiu
          ? 'A sessão foi encerrada e os rascunhos locais foram apagados deste navegador. Em computadores compartilhados, feche também a janela.'
          : 'encerrando a sessão…'}
      </p>
      <div className="flex flex-col items-center gap-3 w-full">
        <Link href="/admin/login" className={classeBotao('principal', 'w-full py-2.5')}>
          entrar de novo
        </Link>
        <Link href="/" className="font-display text-sm text-azul-escuro hover:underline">
          ir para o site
        </Link>
      </div>
    </TelaConexao>
  );
}
