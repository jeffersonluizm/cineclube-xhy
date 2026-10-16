'use client';

import { useEffect, useState } from 'react';
import { adminApi, InfoDemo } from '@/lib/adminApi';
import { intervaloEmTexto } from '@/lib/intervalo';
import { classeBotao } from './estilos';

const ACORDANDO_APOS_MS = 2500;

/**
 * "Explore a demonstração": aparece no login só quando a API está em modo demonstração
 * (GET /api/demo). Enquanto a API gratuita acorda (30 a 60 s), explica a espera em vez de
 * parecer quebrado.
 */
export default function CartaoDemo({ aoEntrar }: { aoEntrar: () => void }) {
  const [info, setInfo] = useState<InfoDemo | null>(null);
  const [acordando, setAcordando] = useState(false);
  const [entrando, setEntrando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let ativo = true;
    const aviso = setTimeout(() => ativo && setAcordando(true), ACORDANDO_APOS_MS);
    adminApi
      .demo()
      .then((d) => ativo && setInfo(d))
      .catch(() => {
        /* sem demonstração ou API fora: o login normal continua disponível */
      })
      .finally(() => {
        clearTimeout(aviso);
        if (ativo) setAcordando(false);
      });
    return () => {
      ativo = false;
      clearTimeout(aviso);
    };
  }, []);

  async function entrar() {
    setErro('');
    setEntrando(true);
    try {
      await adminApi.entrarDemo('editor');
      aoEntrar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível entrar na demonstração.');
      setEntrando(false);
    }
  }

  if (acordando) {
    return (
      <p role="status" className="w-full border-l-4 border-gold-escuro bg-papel px-4 py-3 font-sans text-sm text-text-dark">
        Acordando o servidor de demonstração… Na hospedagem gratuita ele dorme sem visitas e leva até um minuto para responder.
      </p>
    );
  }
  if (!info) return null;
  const papel = info.papeis[0];

  return (
    <section aria-labelledby="titulo-demo" className="w-full border-2 border-text-dark bg-papel px-4 py-4 flex flex-col gap-3">
      <h2 id="titulo-demo" className="font-display font-black text-text-dark text-lg">
        Explore a demonstração
      </h2>
      <p className="font-sans text-sm text-text-dark">{papel.descricao}</p>
      <button type="button" onClick={entrar} disabled={entrando} className={classeBotao('principal', 'w-full py-2.5')}>
        {entrando ? 'entrando…' : papel.rotulo}
      </button>
      <p className="font-sans text-xs text-text-suave">
        {info.resetMinutos > 0
          ? `Pode editar e excluir à vontade: os dados de exemplo voltam ao original a cada ${intervaloEmTexto(info.resetMinutos)}.`
          : 'Pode editar e excluir à vontade.'}
      </p>
      <div aria-live="assertive">{erro && <p className="font-sans text-sm text-pink-escuro">{erro}</p>}</div>
    </section>
  );
}
