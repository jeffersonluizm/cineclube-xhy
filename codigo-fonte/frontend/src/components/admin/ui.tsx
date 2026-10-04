'use client';

import Link from 'next/link';
import { forwardRef, useEffect, useId, useState } from 'react';

/**
 * Peças base do painel, na estética do impresso: papel creme, fios finos, sem cantos
 * arredondados nem sombras; Nunito nos títulos, Inter nos campos. Todas as cores vêm dos
 * tokens (contraste AA conferido em lib/tokens.test.ts).
 */

const baseCampo =
  'mt-1 w-full border border-text-dark/60 bg-papel px-3 py-2 font-sans text-text-dark placeholder:text-text-suave focus:border-text-dark focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-pink-escuro aria-[invalid=true]:border-pink-escuro';

interface CampoBase {
  rotulo: string;
  dica?: string;
  erro?: string;
  className?: string;
}

export const Campo = forwardRef<HTMLInputElement, CampoBase & React.InputHTMLAttributes<HTMLInputElement>>(function Campo(
  { rotulo, dica, erro, className = '', id, ...props },
  ref
) {
  const auto = useId();
  const campoId = id ?? auto;
  return (
    <div className={className}>
      <label htmlFor={campoId} className="font-display text-sm text-text-dark">
        {rotulo}
        {props.required && <span className="text-pink-escuro"> *</span>}
      </label>
      <input
        ref={ref}
        id={campoId}
        aria-invalid={erro ? true : undefined}
        aria-describedby={[dica && `${campoId}-dica`, erro && `${campoId}-erro`].filter(Boolean).join(' ') || undefined}
        className={baseCampo}
        {...props}
      />
      {dica && (
        <p id={`${campoId}-dica`} className="font-sans text-xs text-text-suave mt-1">
          {dica}
        </p>
      )}
      {erro && (
        <p id={`${campoId}-erro`} className="font-sans text-xs text-pink-escuro mt-1">
          {erro}
        </p>
      )}
    </div>
  );
});

export function AreaTexto({ rotulo, dica, className = '', id, ...props }: CampoBase & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const auto = useId();
  const campoId = id ?? auto;
  return (
    <div className={className}>
      <label htmlFor={campoId} className="font-display text-sm text-text-dark">
        {rotulo}
        {props.required && <span className="text-pink-escuro"> *</span>}
      </label>
      <textarea id={campoId} aria-describedby={dica ? `${campoId}-dica` : undefined} className={baseCampo} {...props} />
      {dica && (
        <p id={`${campoId}-dica`} className="font-sans text-xs text-text-suave mt-1">
          {dica}
        </p>
      )}
    </div>
  );
}

export function Seletor({ rotulo, className = '', id, children, ...props }: CampoBase & React.SelectHTMLAttributes<HTMLSelectElement>) {
  const auto = useId();
  const campoId = id ?? auto;
  return (
    <div className={className}>
      <label htmlFor={campoId} className="font-display text-sm text-text-dark">
        {rotulo}
      </label>
      <select id={campoId} className={baseCampo} {...props}>
        {children}
      </select>
    </div>
  );
}

import { classeBotao, type Variante } from './estilos';

export { classeBotao };

export function Botao({
  variante = 'principal',
  className = '',
  ...props
}: { variante?: Variante } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" className={classeBotao(variante, className)} {...props} />;
}

export function BotaoLink({
  variante = 'principal',
  className = '',
  ...props
}: { variante?: Variante } & React.ComponentProps<typeof Link>) {
  return <Link className={classeBotao(variante, className)} {...props} />;
}

/** Mensagem dentro da página. Erros usam role=alert (lidos na hora); avisos, role=status */
export function Alerta({
  tipo = 'erro',
  children,
  className = '',
}: {
  tipo?: 'erro' | 'sucesso' | 'aviso';
  children: React.ReactNode;
  className?: string;
}) {
  const estilo = {
    erro: 'border-pink-escuro text-pink-escuro',
    sucesso: 'border-olive-escuro text-olive-escuro',
    aviso: 'border-gold-escuro text-gold-escuro',
  }[tipo];
  return (
    <div role={tipo === 'erro' ? 'alert' : 'status'} className={`border-l-4 bg-papel px-4 py-3 font-sans text-sm ${estilo} ${className}`}>
      {children}
    </div>
  );
}

/** Seção do painel: título com fio fino em cima, como uma seção do impresso */
export function Secao({
  titulo,
  descricao,
  acoes,
  children,
  className = '',
}: {
  titulo: string;
  descricao?: string;
  acoes?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <section aria-labelledby={id} className={`border-t-2 border-text-dark pt-4 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h2 id={id} className="font-display font-black text-text-dark text-xl">
            {titulo}
          </h2>
          {descricao && <p className="font-sans text-sm text-text-suave mt-1 max-w-2xl">{descricao}</p>}
        </div>
        {acoes}
      </div>
      {children}
    </section>
  );
}

export function CabecalhoPagina({ titulo, sobretitulo, acoes }: { titulo: string; sobretitulo?: string; acoes?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-8 pb-4 border-b border-text-dark/20">
      <div>
        {sobretitulo && <p className="font-serif italic text-pink-escuro text-sm mb-1">{sobretitulo}</p>}
        <h1 className="font-display font-black text-text-dark text-3xl sm:text-4xl leading-tight">{titulo}</h1>
      </div>
      {acoes && <div className="flex flex-wrap items-center gap-4">{acoes}</div>}
    </div>
  );
}

export function EstadoCarregando({ texto = 'carregando…' }: { texto?: string }) {
  // Depois de alguns segundos, explica a espera: a API gratuita pode estar acordando
  const [demorando, setDemorando] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDemorando(true), 4000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div role="status" aria-live="polite" className="animate-pulse flex flex-col gap-3 max-w-xl">
      <div className="h-6 w-1/2 bg-text-dark/10" />
      <div className="h-4 w-full bg-text-dark/10" />
      <div className="h-4 w-4/5 bg-text-dark/10" />
      <span className="font-sans text-sm text-text-suave">
        {demorando ? 'Acordando o servidor… na hospedagem gratuita ele leva até um minuto na primeira visita.' : texto}
      </span>
    </div>
  );
}

export function EstadoErro({ mensagem, tentarDeNovo }: { mensagem: string; tentarDeNovo?: () => void }) {
  return (
    <Alerta tipo="erro">
      <p className="mb-2">{mensagem}</p>
      {tentarDeNovo && (
        <Botao variante="texto-perigo" onClick={tentarDeNovo} className="underline">
          tentar de novo
        </Botao>
      )}
    </Alerta>
  );
}

export function EstadoVazio({ children }: { children: React.ReactNode }) {
  return <p className="font-serif italic text-text-dark text-lg border border-dashed border-text-dark/40 px-5 py-6">{children}</p>;
}

/** Barra fixa no rodapé do formulário com o botão de salvar e o estado das alterações */
export function BarraSalvar({
  salvando,
  sujo,
  rotulo = 'salvar',
  children,
}: {
  salvando: boolean;
  sujo?: boolean;
  rotulo?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="sticky bottom-0 z-10 bg-cream/95 border-t border-text-dark/20 py-3 flex flex-wrap items-center gap-4">
      <button type="submit" disabled={salvando} className={classeBotao('principal', 'px-8')}>
        {salvando ? 'salvando…' : rotulo}
      </button>
      {sujo !== undefined && (
        <span className={`font-sans text-sm ${sujo ? 'text-gold-escuro' : 'text-text-suave'}`} aria-live="polite">
          {sujo ? 'alterações não salvas' : 'tudo salvo'}
        </span>
      )}
      {children}
    </div>
  );
}

/** Botões de mover para cima/baixo (alternativa de teclado ao arrastar) */
export function MoverItem({
  indice,
  total,
  rotulo,
  aoMover,
  desabilitado = false,
}: {
  indice: number;
  total: number;
  rotulo: string;
  aoMover: (dir: -1 | 1) => void;
  desabilitado?: boolean;
}) {
  const estilo = 'text-text-dark hover:text-pink-escuro disabled:opacity-30 leading-none p-1';
  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => aoMover(-1)}
        disabled={desabilitado || indice === 0}
        aria-label={`mover "${rotulo}" para cima`}
        className={estilo}
      >
        ▲
      </button>
      <button
        type="button"
        onClick={() => aoMover(1)}
        disabled={desabilitado || indice === total - 1}
        aria-label={`mover "${rotulo}" para baixo`}
        className={estilo}
      >
        ▼
      </button>
    </div>
  );
}
