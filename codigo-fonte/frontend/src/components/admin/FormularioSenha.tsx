'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { adminApi, ErroLimiteLogin } from '@/lib/adminApi';
import { tempoPorExtenso } from '@/lib/login';
import { classeBotao } from './ui';

interface FormularioSenhaProps {
  aoEntrar: () => void;
  rotuloBotao?: string;
  autoFocus?: boolean;
}

/**
 * Senha do editor, usada no login e no re-login da sessão expirada.
 * Mostrar/ocultar senha, autocomplete para gerenciadores de senha, erro anunciado ao leitor
 * de tela e, depois de muitas tentativas, a contagem até poder tentar de novo.
 */
export default function FormularioSenha({ aoEntrar, rotuloBotao = 'entrar', autoFocus = true }: FormularioSenhaProps) {
  const [senha, setSenha] = useState('');
  const [mostrar, setMostrar] = useState(false);
  const [erro, setErro] = useState('');
  const [entrando, setEntrando] = useState(false);
  const [espera, setEspera] = useState(0);
  const [capsLock, setCapsLock] = useState(false);
  const campoRef = useRef<HTMLInputElement>(null);
  const id = useId();

  // Contagem regressiva do bloqueio por excesso de tentativas
  useEffect(() => {
    if (espera <= 0) return;
    const t = setInterval(() => setEspera((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [espera]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setEntrando(true);
    try {
      await adminApi.login(senha);
      setSenha('');
      aoEntrar();
    } catch (err) {
      if (err instanceof ErroLimiteLogin) {
        setEspera(err.segundos ?? 900);
        setErro(err.segundos ? `Muitas tentativas seguidas. Tente de novo em ${tempoPorExtenso(err.segundos)}.` : err.message);
      } else {
        setErro(err instanceof Error ? err.message : 'Não foi possível entrar.');
        campoRef.current?.focus();
        campoRef.current?.select();
      }
    } finally {
      setEntrando(false);
    }
  }

  const bloqueado = espera > 0;

  return (
    <form onSubmit={enviar} className="flex flex-col gap-4 w-full" noValidate>
      {/* Campo de usuário oculto: gerenciadores de senha associam a senha a "editor" */}
      <input type="text" name="username" autoComplete="username" value="editor" readOnly hidden aria-hidden="true" tabIndex={-1} />

      <div>
        <label htmlFor={`${id}-senha`} className="font-display text-sm text-text-dark">
          senha do editor
        </label>
        <div className="mt-1 flex border border-text-dark/60 bg-papel focus-within:outline focus-within:outline-2 focus-within:outline-pink-escuro">
          <input
            ref={campoRef}
            id={`${id}-senha`}
            name="password"
            type={mostrar ? 'text' : 'password'}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            onKeyUp={(e) => setCapsLock(e.getModifierState('CapsLock'))}
            autoComplete="current-password"
            autoFocus={autoFocus}
            required
            aria-invalid={erro && !bloqueado ? true : undefined}
            aria-describedby={`${id}-ajuda`}
            className="flex-1 min-w-0 bg-transparent px-3 py-2 font-sans text-text-dark focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setMostrar((m) => !m)}
            aria-pressed={mostrar}
            aria-controls={`${id}-senha`}
            className="font-display text-sm text-azul-escuro px-3 hover:underline border-l border-text-dark/30"
          >
            {mostrar ? 'ocultar' : 'mostrar'}
          </button>
        </div>
        <p id={`${id}-ajuda`} className="font-sans text-xs text-text-suave mt-1">
          A mesma senha para toda a equipe do cineclube.
        </p>
        {capsLock && (
          <p className="font-sans text-xs text-gold-escuro mt-1" role="status">
            Caps Lock está ligado.
          </p>
        )}
      </div>

      <div aria-live="assertive" className="min-h-[1.25rem]">
        {erro && (
          <p className="font-sans text-sm text-pink-escuro">
            {erro}
            {bloqueado && espera > 0 && <span className="block text-text-suave">liberado em {tempoPorExtenso(espera)}</span>}
          </p>
        )}
      </div>

      <button type="submit" disabled={entrando || !senha || bloqueado} className={classeBotao('principal', 'w-full py-2.5')}>
        {entrando ? 'entrando…' : rotuloBotao}
      </button>
    </form>
  );
}
