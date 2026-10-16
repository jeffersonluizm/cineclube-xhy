'use client';

import { Botao } from './ui';

interface CampoNotasProps {
  notas: string[];
  aoMudar: (notas: string[]) => void;
  titulo?: string;
  dica?: string;
}

/** Lista editável de notas de rodapé (texto, ciclo, filme) */
export default function CampoNotas({ notas, aoMudar, titulo = 'notas de rodapé', dica }: CampoNotasProps) {
  return (
    <fieldset className="border-t border-text-dark/20 pt-4">
      <legend className="font-display font-bold text-text-dark text-lg pr-2">{titulo}</legend>
      {dica && <p className="font-sans text-xs text-text-suave mb-3">{dica}</p>}
      <ol className="flex flex-col gap-2">
        {notas.map((nota, i) => (
          <li key={i} className="flex gap-2 items-start">
            <label htmlFor={`nota-${i}`} className="font-serif text-text-suave pt-2 w-6 shrink-0">
              {i + 1}.
            </label>
            <textarea
              id={`nota-${i}`}
              value={nota}
              onChange={(e) => aoMudar(notas.map((n, j) => (j === i ? e.target.value : n)))}
              rows={2}
              className="flex-1 border border-text-dark/60 bg-papel px-3 py-2 font-sans text-text-dark"
            />
            <button
              type="button"
              onClick={() => aoMudar(notas.filter((_, j) => j !== i))}
              aria-label={`remover nota ${i + 1}`}
              className="text-pink-escuro hover:text-text-dark px-2 pt-2"
            >
              ✕
            </button>
          </li>
        ))}
      </ol>
      <Botao variante="texto" onClick={() => aoMudar([...notas, ''])} className="text-sm mt-2">
        + adicionar nota
      </Botao>
    </fieldset>
  );
}
