'use client';

import { useState } from 'react';
import { AboutInput } from '@/lib/adminApi';
import type { About, Block, TeamMember, TeamMemberLink } from '@/lib/types';
import BlocksEditor from './BlocksEditor';
import AvisoSaida from './AvisoSaida';
import { useSujo } from './hooks';
import { Alerta, BarraSalvar, Botao, Campo } from './ui';

interface AboutFormProps {
  initial?: About;
  onSave: (data: AboutInput) => Promise<void>;
}

const urlValida = (url: string) => /^(https:\/\/|mailto:)\S+$/i.test(url.trim());

export default function AboutForm({ initial, onSave }: AboutFormProps) {
  const [blocks, setBlocks] = useState<Block[]>(
    initial?.blocks?.length
      ? initial.blocks
      : initial?.content
        ? initial.content
            .split('\n')
            .filter(Boolean)
            .map((text) => ({ type: 'paragraph' as const, text }))
        : [{ type: 'paragraph', text: '' }]
  );
  const [team, setTeam] = useState<TeamMember[]>(initial?.team ?? []);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const { sujo, marcarSalvo } = useSujo({ blocks, team });

  const atualizarMembro = (i: number, patch: Partial<TeamMember>) =>
    setTeam((prev) => prev.map((m, j) => (j === i ? { ...m, ...patch } : m)));
  const atualizarLinks = (i: number, f: (links: TeamMemberLink[]) => TeamMemberLink[]) =>
    setTeam((prev) => prev.map((m, j) => (j === i ? { ...m, links: f(m.links ?? []) } : m)));

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setSalvando(true);
    try {
      await onSave({
        blocks: blocks.filter((b) => (b.type === 'image' ? Boolean(b.src) : Boolean(b.text?.trim()))),
        team: team
          .filter((m) => m.name.trim() && m.role.trim())
          .map((m) => ({ ...m, email: m.email?.trim() || '', links: (m.links ?? []).filter((l) => l.label.trim() && l.url.trim()) })),
      });
      marcarSalvo();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-8 max-w-3xl">
      <AvisoSaida sujo={sujo && !salvando} />
      <BlocksEditor
        blocks={blocks}
        onChange={setBlocks}
        title="texto e fotos do cineclube"
        description="Monte a apresentação em blocos: escreva parágrafos, intercale fotos onde quiser e use as setas ou arraste (⠿) para reorganizar."
      />

      <fieldset className="border-t-2 border-text-dark pt-4">
        <legend className="font-display font-black text-pink-escuro text-sm tracking-widest pr-2">EQUIPE/INTEGRANTES/CORPO</legend>

        <ol className="flex flex-col gap-3 mt-2">
          {team.map((m, i) => (
            <li key={i} className="border border-text-dark/30 p-4 flex flex-col gap-3">
              <div className="grid gap-3 md:grid-cols-3">
                <Campo rotulo="nome" value={m.name} onChange={(e) => atualizarMembro(i, { name: e.target.value })} />
                <Campo
                  rotulo="função"
                  dica="ex.: coordenação, editorial"
                  value={m.role}
                  onChange={(e) => atualizarMembro(i, { role: e.target.value })}
                />
                <Campo rotulo="e-mail" type="email" value={m.email ?? ''} onChange={(e) => atualizarMembro(i, { email: e.target.value })} />
              </div>

              <fieldset className="pl-3 border-l-2 border-text-dark/20 flex flex-col gap-2">
                <legend className="font-sans text-xs text-text-suave">redes sociais e contatos (links https:// ou mailto:)</legend>
                {(m.links ?? []).map((l, j) => (
                  <div key={j} className="grid gap-2 sm:grid-cols-[1fr,2fr,auto] items-start">
                    <Campo
                      rotulo={`nome do link ${j + 1}`}
                      placeholder="Instagram, Letterboxd, site"
                      value={l.label}
                      onChange={(e) => atualizarLinks(i, (ls) => ls.map((x, k) => (k === j ? { ...x, label: e.target.value } : x)))}
                    />
                    <Campo
                      rotulo={`endereço do link ${j + 1}`}
                      placeholder="https://…"
                      value={l.url}
                      erro={l.url && !urlValida(l.url) ? 'Use um endereço que comece com https:// ou mailto:' : undefined}
                      onChange={(e) => atualizarLinks(i, (ls) => ls.map((x, k) => (k === j ? { ...x, url: e.target.value } : x)))}
                    />
                    <Botao
                      variante="texto-perigo"
                      className="mt-7 text-sm"
                      onClick={() => atualizarLinks(i, (ls) => ls.filter((_, k) => k !== j))}
                    >
                      remover link
                    </Botao>
                  </div>
                ))}
                <Botao
                  variante="texto"
                  className="self-start text-xs"
                  onClick={() => atualizarLinks(i, (ls) => [...ls, { label: '', url: '' }])}
                >
                  + adicionar link
                </Botao>
              </fieldset>

              <Botao variante="texto-perigo" className="self-end text-sm" onClick={() => setTeam((prev) => prev.filter((_, j) => j !== i))}>
                remover {m.name || 'integrante'}
              </Botao>
            </li>
          ))}
        </ol>

        <Botao
          variante="texto"
          className="text-sm mt-3"
          onClick={() => setTeam((prev) => [...prev, { name: '', role: '', email: '', links: [] }])}
        >
          + adicionar integrante
        </Botao>
      </fieldset>

      {erro && <Alerta>{erro}</Alerta>}
      <BarraSalvar salvando={salvando} sujo={sujo} />
    </form>
  );
}
