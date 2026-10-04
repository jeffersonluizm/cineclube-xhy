'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { adminApi, ErroSessaoExpirada } from '@/lib/adminApi';
import { EVENTO_SESSAO_EXPIRADA, EVENTO_SESSAO_RENOVADA, lerToken, segundosRestantes } from '@/lib/sessao';
import { Dialogo } from './Dialogo';
import FormularioSenha from './FormularioSenha';
import { Botao } from './ui';
import { useToast } from './Toasts';

const AVISAR_ANTES_S = 10 * 60;

/**
 * Cuida da sessão do editor dentro do painel:
 *  - ao abrir uma página, confere o token (local e na API) e manda para o login se preciso;
 *  - 10 minutos antes de expirar, avisa com um botão para renovar;
 *  - se a API recusar o token no meio do trabalho (401), abre o re-login POR CIMA da página:
 *    o formulário continua preenchido e basta salvar de novo depois de entrar.
 */
export default function Sessao({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const caminho = usePathname() ?? '/admin';
  const avisar = useToast();
  const [pronto, setPronto] = useState(false);
  const [restante, setRestante] = useState<number>(() => segundosRestantes(lerToken()));
  const [relogin, setRelogin] = useState<'expirou' | 'renovar' | null>(null);

  // Ao abrir: sem token ou token vencido vai para as páginas de conexão, com volta para cá
  useEffect(() => {
    const token = lerToken();
    const volta = encodeURIComponent(caminho);
    if (!token) {
      router.replace(`/admin/login?motivo=necessario&next=${volta}`);
      return;
    }
    if (segundosRestantes(token) === 0) {
      router.replace(`/admin/sessao-expirada?next=${volta}`);
      return;
    }
    setPronto(true);
    // A API é quem decide: um token revogado (troca do segredo) também cai aqui
    adminApi.sessao().catch((e) => {
      if (e instanceof ErroSessaoExpirada) router.replace(`/admin/sessao-expirada?next=${volta}`);
    });
    // só na primeira montagem do painel
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Relógio da sessão
  useEffect(() => {
    const t = setInterval(() => setRestante(segundosRestantes(lerToken())), 15_000);
    const renovada = () => setRestante(segundosRestantes(lerToken()));
    const expirou = () => setRelogin('expirou');
    window.addEventListener(EVENTO_SESSAO_RENOVADA, renovada);
    window.addEventListener(EVENTO_SESSAO_EXPIRADA, expirou);
    return () => {
      clearInterval(t);
      window.removeEventListener(EVENTO_SESSAO_RENOVADA, renovada);
      window.removeEventListener(EVENTO_SESSAO_EXPIRADA, expirou);
    };
  }, []);

  useEffect(() => {
    if (pronto && restante === 0 && !relogin) setRelogin('expirou');
  }, [pronto, restante, relogin]);

  const aoEntrar = useCallback(() => {
    setRelogin(null);
    setRestante(segundosRestantes(lerToken()));
    avisar('Sessão renovada. Se estava salvando algo, clique em salvar de novo.');
  }, [avisar]);

  if (!pronto) return null;

  const minutos = Math.ceil(restante / 60);

  return (
    <>
      {restante > 0 && restante <= AVISAR_ANTES_S && (
        <div role="status" className="bg-gold-escuro text-white font-sans text-sm px-4 sm:px-8 py-2 flex flex-wrap items-center gap-3">
          <span>
            Sua sessão expira em {minutos} {minutos === 1 ? 'minuto' : 'minutos'}. Salve o que estiver editando ou renove agora.
          </span>
          <button type="button" onClick={() => setRelogin('renovar')} className="underline font-bold">
            renovar sessão
          </button>
        </div>
      )}

      {children}

      <Dialogo
        aberto={relogin !== null}
        titulo={relogin === 'expirou' ? 'Sua sessão expirou' : 'Renovar a sessão'}
        aoFechar={() => setRelogin(null)}
      >
        <p className="font-sans text-sm mb-4">
          {relogin === 'expirou'
            ? 'Por segurança, a sessão dura 8 horas. Digite a senha para continuar: nada do que está nesta página foi perdido.'
            : 'Digite a senha para ganhar mais 8 horas de sessão.'}
        </p>
        <FormularioSenha aoEntrar={aoEntrar} rotuloBotao="continuar" />
        <div className="mt-4 text-right">
          <Botao variante="texto" onClick={() => setRelogin(null)}>
            agora não
          </Botao>
        </div>
      </Dialogo>
    </>
  );
}
