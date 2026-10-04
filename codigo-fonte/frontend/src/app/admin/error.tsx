'use client';

import Link from 'next/link';
import { Botao } from '@/components/admin/ui';

/** Falha inesperada dentro do painel: mantém o cabeçalho e oferece tentar de novo */
export default function PainelErro({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div role="alert" className="max-w-xl">
      <p className="font-serif italic text-pink-escuro text-sm mb-2">algo deu errado</p>
      <h1 className="font-display font-black text-text-dark text-3xl mb-4">esta tela do painel não abriu</h1>
      <p className="font-sans text-text-dark mb-6">
        Pode ser uma falha momentânea de conexão com o servidor. O que já estava salvo continua salvo.
      </p>
      <div className="flex flex-wrap gap-4 items-center">
        <Botao onClick={reset}>tentar de novo</Botao>
        <Link href="/admin" className="font-display text-azul-escuro hover:underline">
          início do painel
        </Link>
      </div>
    </div>
  );
}
