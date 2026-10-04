'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Alerta, Botao } from './ui';

interface DialogoProps {
  aberto: boolean;
  titulo: string;
  aoFechar: () => void;
  children: React.ReactNode;
  /** papel ARIA: alertdialog para confirmações destrutivas */
  papel?: 'dialog' | 'alertdialog';
}

/**
 * Diálogo modal com o <dialog> nativo: foco preso dentro, Esc fecha, fundo inerte e
 * o foco volta para quem abriu.
 */
export function Dialogo({ aberto, titulo, aoFechar, children, papel = 'dialog' }: DialogoProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const tituloId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (aberto && !el.open) el.showModal();
    if (!aberto && el.open) el.close();
  }, [aberto]);

  return (
    <dialog
      ref={ref}
      role={papel}
      aria-labelledby={tituloId}
      aria-modal="true"
      onClose={aoFechar}
      onCancel={(e) => {
        e.preventDefault();
        aoFechar();
      }}
      className="bg-cream text-text-dark border-2 border-text-dark p-0 w-[min(32rem,calc(100vw-2rem))]"
    >
      <div className="p-6">
        <h2 id={tituloId} className="font-display font-black text-xl mb-4">
          {titulo}
        </h2>
        {children}
      </div>
    </dialog>
  );
}

interface DialogoExclusaoProps {
  aberto: boolean;
  /** o que será excluído, ex.: 'a revista n°3' */
  oQue: string;
  /** nome que o editor digita para confirmar quando a exclusão leva outros itens junto */
  confirmacao: string;
  /** carrega o que vai junto (ex.: { textos: 12, filmes: 3 }) */
  carregarImpacto?: () => Promise<Record<string, number>>;
  aoConfirmar: () => Promise<void>;
  aoFechar: () => void;
}

const ROTULO_IMPACTO: Record<string, [string, string]> = {
  textos: ['texto', 'textos'],
  filmes: ['página de filme', 'páginas de filme'],
};

/**
 * Confirmação de exclusão. Quando a exclusão leva conteúdo junto (exclusão em cascata),
 * mostra quanto e pede para digitar o nome: um clique distraído não apaga uma edição inteira.
 */
export function DialogoExclusao({ aberto, oQue, confirmacao, carregarImpacto, aoConfirmar, aoFechar }: DialogoExclusaoProps) {
  const [impacto, setImpacto] = useState<Record<string, number> | null>(null);
  const [digitado, setDigitado] = useState('');
  const [erro, setErro] = useState('');
  const [excluindo, setExcluindo] = useState(false);
  const campoId = useId();

  useEffect(() => {
    if (!aberto) return;
    setDigitado('');
    setErro('');
    setImpacto(null);
    if (carregarImpacto) {
      carregarImpacto()
        .then(setImpacto)
        .catch(() => setImpacto({}));
    } else {
      setImpacto({});
    }
  }, [aberto, carregarImpacto]);

  const itens = Object.entries(impacto ?? {}).filter(([, n]) => n > 0);
  const emCascata = itens.length > 0;
  const liberado = impacto !== null && (!emCascata || digitado.trim() === confirmacao.trim());

  async function confirmar() {
    setErro('');
    setExcluindo(true);
    try {
      await aoConfirmar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível excluir.');
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <Dialogo aberto={aberto} titulo={`Excluir ${oQue}?`} aoFechar={aoFechar} papel="alertdialog">
      {impacto === null ? (
        <p className="font-sans text-sm text-text-suave" role="status">
          conferindo o que vai junto…
        </p>
      ) : emCascata ? (
        <>
          <p className="font-sans text-sm mb-2">Junto serão apagados, sem como desfazer:</p>
          <ul className="font-sans text-sm list-disc pl-6 mb-4">
            {itens.map(([chave, n]) => (
              <li key={chave}>
                <strong>{n}</strong> {(ROTULO_IMPACTO[chave] ?? [chave, chave])[n === 1 ? 0 : 1]}
              </li>
            ))}
          </ul>
          <label htmlFor={campoId} className="font-sans text-sm block mb-1">
            Para confirmar, digite <strong>{confirmacao}</strong>
          </label>
          <input
            id={campoId}
            value={digitado}
            onChange={(e) => setDigitado(e.target.value)}
            autoComplete="off"
            className="w-full border border-text-dark/60 bg-papel px-3 py-2 font-sans mb-4"
          />
        </>
      ) : (
        <p className="font-sans text-sm mb-4">Essa ação não pode ser desfeita.</p>
      )}

      {erro && (
        <Alerta tipo="erro" className="mb-4">
          {erro}
        </Alerta>
      )}

      <div className="flex flex-wrap gap-3 justify-end">
        <Botao variante="secundario" onClick={aoFechar} autoFocus>
          cancelar
        </Botao>
        <Botao variante="perigo" onClick={confirmar} disabled={!liberado || excluindo}>
          {excluindo ? 'excluindo…' : 'excluir'}
        </Botao>
      </div>
    </Dialogo>
  );
}
