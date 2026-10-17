'use client';

import Link from 'next/link';
import { useState } from 'react';
import { DialogoExclusao } from './Dialogo';
import { EstadoVazio, MoverItem } from './ui';
import { ALVO_TOQUE } from './estilos';
import { useToast } from './Toasts';

interface ItemLista {
  _id: string;
}

interface ListaReordenavelProps<T extends ItemLista> {
  itens: T[];
  aoMudar: (itens: T[]) => void;
  titulo: (item: T) => string;
  detalhe: (item: T) => React.ReactNode;
  hrefEditar: (item: T) => string;
  /** grava a nova ordem na API */
  reordenar: (ids: string[]) => Promise<unknown>;
  excluir: (item: T) => Promise<unknown>;
  /** ex.: "o texto" / "a página do filme" */
  artigo: string;
  vazio: React.ReactNode;
}

/**
 * Lista do painel com reordenação (setas), edição e exclusão. A ordem muda na tela na hora
 * e volta se a API falhar; toda ação termina com um aviso de sucesso ou de erro.
 */
export default function ListaReordenavel<T extends ItemLista>({
  itens,
  aoMudar,
  titulo,
  detalhe,
  hrefEditar,
  reordenar,
  excluir,
  artigo,
  vazio,
}: ListaReordenavelProps<T>) {
  const avisar = useToast();
  const [paraExcluir, setParaExcluir] = useState<T | null>(null);
  // Uma reordenação por vez: sem pedidos concorrentes, a volta em caso de erro bate com o banco
  const [gravando, setGravando] = useState(false);

  async function mover(indice: number, dir: -1 | 1) {
    const alvo = indice + dir;
    if (alvo < 0 || alvo >= itens.length) return;
    const antes = itens;
    const depois = [...itens];
    [depois[indice], depois[alvo]] = [depois[alvo], depois[indice]];
    aoMudar(depois);
    setGravando(true);
    try {
      await reordenar(depois.map((i) => i._id));
    } catch (e) {
      aoMudar(antes); // a tela volta para a ordem que está salva
      avisar(`Não foi possível reordenar: ${e instanceof Error ? e.message : 'erro desconhecido'}`, 'erro');
    } finally {
      setGravando(false);
    }
  }

  if (itens.length === 0) return <EstadoVazio>{vazio}</EstadoVazio>;

  return (
    <>
      <ol className="border-t border-text-dark/20">
        {itens.map((item, i) => (
          <li key={item._id} className="flex items-center gap-4 py-3 border-b border-text-dark/20">
            <MoverItem indice={i} total={itens.length} rotulo={titulo(item)} aoMover={(dir) => mover(i, dir)} desabilitado={gravando} />
            <div className="min-w-0 flex-1">
              <p className="font-display font-bold text-text-dark truncate">{titulo(item)}</p>
              <p className="font-sans text-sm text-text-suave">{detalhe(item)}</p>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <Link
                href={hrefEditar(item)}
                className={`font-display text-azul-escuro hover:underline inline-flex items-center ${ALVO_TOQUE}`}
              >
                editar<span className="sr-only"> {titulo(item)}</span>
              </Link>
              <button
                type="button"
                onClick={() => setParaExcluir(item)}
                className={`font-display text-pink-escuro hover:underline inline-flex items-center ${ALVO_TOQUE}`}
              >
                excluir<span className="sr-only"> {titulo(item)}</span>
              </button>
            </div>
          </li>
        ))}
      </ol>

      <DialogoExclusao
        aberto={paraExcluir !== null}
        oQue={paraExcluir ? `${artigo} "${titulo(paraExcluir)}"` : ''}
        confirmacao={paraExcluir ? titulo(paraExcluir) : ''}
        aoFechar={() => setParaExcluir(null)}
        aoConfirmar={async () => {
          if (!paraExcluir) return;
          await excluir(paraExcluir);
          aoMudar(itens.filter((x) => x._id !== paraExcluir._id));
          avisar(`Excluído: "${titulo(paraExcluir)}".`);
          setParaExcluir(null);
        }}
      />
    </>
  );
}
