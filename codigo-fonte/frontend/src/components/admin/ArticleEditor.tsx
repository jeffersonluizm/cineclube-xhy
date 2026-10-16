'use client';

import { useState } from 'react';
import { ArticleInput } from '@/lib/adminApi';
import type { Article, Block } from '@/lib/types';
import { comChaves, semChaves } from '@/lib/blocos';
import BlocksEditor from './BlocksEditor';
import ImageUploadField from './ImageUploadField';
import CampoNotas from './CampoNotas';
import AvisoSaida from './AvisoSaida';
import { useRascunhoLocal, useSujo } from './hooks';
import { Alerta, AreaTexto, BarraSalvar, Botao, Campo } from './ui';

interface ArticleEditorProps {
  parentId: string;
  parentType?: 'revista' | 'catalogo' | 'ciclo';
  initial?: Article;
  onSave: (data: ArticleInput) => Promise<void>;
}

interface Estado {
  title: string;
  author: string;
  column: string;
  epigraph: string;
  coverImage: string;
  footnotes: string[];
  published: boolean;
  blocks: Block[];
}

function estadoInicial(initial?: Article): Estado {
  return {
    title: initial?.title ?? '',
    author: initial?.author ?? '',
    column: initial?.column ?? '',
    epigraph: initial?.epigraph ?? '',
    coverImage: initial?.coverImage ?? '',
    footnotes: initial?.footnotes ?? [],
    published: initial?.published !== false,
    blocks: comChaves(
      initial?.blocks?.length
        ? initial.blocks
        : initial?.content
          ? initial.content
              .split('\n')
              .filter(Boolean)
              .map((text) => ({ type: 'paragraph' as const, text }))
          : [{ type: 'paragraph', text: '' }]
    ),
  };
}

const quando = (ms: number) => new Date(ms).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

/**
 * Editor de textos (revista, catálogo, ciclo). O que é digitado fica também num rascunho
 * local do navegador: se a aba fechar, a página recarregar ou a sessão expirar, dá para
 * restaurar. Sair com alterações não salvas pede confirmação.
 */
export default function ArticleEditor({ parentId, parentType = 'revista', initial, onSave }: ArticleEditorProps) {
  const [v, setV] = useState<Estado>(() => estadoInicial(initial));
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const { sujo, marcarSalvo } = useSujo(v);
  const chaveRascunho = initial ? `texto:${initial._id}` : `novo:${parentType}:${parentId}`;
  const { rascunho, descartarRascunho } = useRascunhoLocal(chaveRascunho, v, sujo);
  const [ofereceuRascunho, setOfereceuRascunho] = useState(false);
  const alterar = (campo: 'title' | 'author' | 'column' | 'epigraph') => (e: { target: { value: string } }) =>
    setV((x) => ({ ...x, [campo]: e.target.value }));

  const temRascunho = !ofereceuRascunho && rascunho && JSON.stringify(rascunho.valor) !== JSON.stringify(v);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setSalvando(true);
    try {
      await onSave({
        title: v.title.trim(),
        author: v.author.trim(),
        column: v.column.trim().toLowerCase(),
        epigraph: v.epigraph.trim(),
        coverImage: v.coverImage,
        blocks: semChaves(v.blocks.filter((b) => (b.type === 'image' ? Boolean(b.src) : Boolean(b.text?.trim())))),
        footnotes: v.footnotes.map((f) => f.trim()).filter(Boolean),
        published: v.published,
        parentType,
        parentId,
      });
      descartarRascunho();
      marcarSalvo();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-8">
      <AvisoSaida sujo={sujo && !salvando} />

      {temRascunho && rascunho && (
        <Alerta tipo="aviso">
          <p className="mb-2">
            Há um rascunho deste texto guardado neste navegador em {quando(rascunho.em)}, com alterações que não foram salvas.
          </p>
          {initial?.updatedAt && rascunho.em < Date.parse(initial.updatedAt) && (
            <p className="mb-2 font-bold">
              Atenção: o texto foi salvo depois deste rascunho ({quando(Date.parse(initial.updatedAt))}). Restaurar desfaz essa versão mais
              nova.
            </p>
          )}
          <div className="flex flex-wrap gap-4">
            <Botao
              variante="texto"
              onClick={() => {
                setV(rascunho.valor);
                setOfereceuRascunho(true);
              }}
            >
              restaurar rascunho
            </Botao>
            <Botao
              variante="texto-perigo"
              onClick={() => {
                descartarRascunho();
                setOfereceuRascunho(true);
              }}
            >
              descartar
            </Botao>
          </div>
        </Alerta>
      )}

      {/* Metadados */}
      <div className="grid gap-4 md:grid-cols-2">
        <Campo className="md:col-span-2" rotulo="título" value={v.title} onChange={alterar('title')} required />
        <Campo rotulo="autor(a)" value={v.author} onChange={alterar('author')} required />
        <Campo rotulo="coluna / seção" dica="ex.: crítica, ensaio, entrevista" value={v.column} onChange={alterar('column')} required />
        <AreaTexto className="md:col-span-2" rotulo="epígrafe" value={v.epigraph} onChange={alterar('epigraph')} rows={2} />
        <div className="md:col-span-2">
          <ImageUploadField
            label="imagem de compartilhamento (opcional)"
            value={v.coverImage}
            onChange={(url) => setV((x) => ({ ...x, coverImage: url }))}
          />
          <p className="font-sans text-xs text-text-suave mt-1">
            Aparece na prévia do link em redes e aplicativos. Sem ela, usa a capa da edição.
          </p>
        </div>
        <label className="flex items-center gap-2 md:col-span-2 font-display text-sm text-text-dark">
          <input
            type="checkbox"
            checked={v.published}
            onChange={(e) => setV((x) => ({ ...x, published: e.target.checked }))}
            className="w-4 h-4 accent-text-dark"
          />
          publicado (desmarque para manter como rascunho, fora do site)
        </label>
      </div>

      <BlocksEditor blocks={v.blocks} onChange={(blocks) => setV((x) => ({ ...x, blocks }))} title="corpo do texto" />

      <CampoNotas
        notas={v.footnotes}
        aoMudar={(footnotes) => setV((x) => ({ ...x, footnotes }))}
        dica="A nota 1 ganha uma chamada ao lado do nome do autor; as outras aparecem na coluna lateral."
      />

      {erro && <Alerta>{erro}</Alerta>}

      <BarraSalvar
        salvando={salvando}
        sujo={sujo}
        rotulo={initial ? 'salvar alterações' : v.published ? 'publicar texto' : 'salvar rascunho'}
      />
    </form>
  );
}
