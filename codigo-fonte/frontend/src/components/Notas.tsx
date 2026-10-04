import { idChamada, idNota } from '@/lib/conteudo';

interface NotasProps {
  /** notas na ordem; a primeira pode ser a nota do autor */
  notas: string[];
  tom?: 'cream' | 'dark';
  className?: string;
}

/** Chamada de nota no texto (¹, ²…) que leva até a nota e volta */
export function ChamadaNota({ n }: { n: number }) {
  return (
    <sup>
      <a id={idChamada(n)} href={`#${idNota(n)}`} aria-label={`nota ${n}`} className="no-underline hover:underline">
        {n}
      </a>
    </sup>
  );
}

/** Notas de rodapé com âncoras: cada uma volta para a sua chamada no texto */
export default function Notas({ notas, tom = 'dark', className = '' }: NotasProps) {
  const lista = notas.filter((n) => n.trim());
  if (lista.length === 0) return null;
  const cor = tom === 'dark' ? 'text-light-text' : 'text-light-escuro';
  return (
    <aside aria-label="notas" className={`md:w-48 shrink-0 border-t border-light-text/30 pt-6 md:border-0 md:pt-0 ${className}`}>
      <ol className="flex flex-col gap-4">
        {lista.map((nota, i) => (
          <li key={i} id={idNota(i + 1)} className={`font-serif text-xs leading-relaxed scroll-mt-6 ${cor}`}>
            <span className="font-bold mr-1">{i + 1}.</span>
            {nota}{' '}
            <a href={`#${idChamada(i + 1)}`} aria-label={`voltar à chamada da nota ${i + 1}`} className="underline">
              ↩
            </a>
          </li>
        ))}
      </ol>
    </aside>
  );
}
