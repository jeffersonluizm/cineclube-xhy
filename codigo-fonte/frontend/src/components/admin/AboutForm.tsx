'use client';

import { useState } from 'react';
import { AboutInput } from '@/lib/adminApi';
import BlocksEditor from './BlocksEditor';
import type { About, Block, TeamMember, TeamMemberLink } from '@/lib/types';

interface AboutFormProps {
  initial?: About;
  onSave: (data: AboutInput) => Promise<void>;
}

const inputClass =
  'mt-1 w-full border border-text-dark/30 rounded px-3 py-2 bg-white font-sans text-text-dark focus:outline-none focus:border-pink';

const emptyMember: TeamMember = { name: '', role: '', email: '', links: [] };
const emptyLink: TeamMemberLink = { label: '', url: '' };

export default function AboutForm({ initial, onSave }: AboutFormProps) {
  const [blocks, setBlocks] = useState<Block[]>(
    initial?.blocks?.length
      ? initial.blocks
      : initial?.content
        ? initial.content.split('\n').filter(Boolean).map((text) => ({ type: 'paragraph' as const, text }))
        : [{ type: 'paragraph', text: '' }]
  );
  const [team, setTeam] = useState<TeamMember[]>(initial?.team ?? []);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function updateMember(index: number, patch: Partial<TeamMember>) {
    setTeam((prev) => prev.map((m, i) => (i === index ? { ...m, ...patch } : m)));
  }

  function addLink(memberIndex: number) {
    setTeam((prev) =>
      prev.map((m, i) => (i === memberIndex ? { ...m, links: [...(m.links ?? []), { ...emptyLink }] } : m))
    );
  }

  function updateLink(memberIndex: number, linkIndex: number, patch: Partial<TeamMemberLink>) {
    setTeam((prev) =>
      prev.map((m, i) =>
        i === memberIndex
          ? { ...m, links: (m.links ?? []).map((l, j) => (j === linkIndex ? { ...l, ...patch } : l)) }
          : m
      )
    );
  }

  function removeLink(memberIndex: number, linkIndex: number) {
    setTeam((prev) =>
      prev.map((m, i) => (i === memberIndex ? { ...m, links: (m.links ?? []).filter((_, j) => j !== linkIndex) } : m))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const cleanBlocks = blocks.filter((b) => (b.type === 'image' ? Boolean(b.src) : Boolean(b.text?.trim())));
      await onSave({
        blocks: cleanBlocks,
        team: team
          .filter((m) => m.name.trim() && m.role.trim())
          .map((m) => ({
            ...m,
            email: m.email?.trim() || undefined,
            links: (m.links ?? []).filter((l) => l.label.trim() && l.url.trim()),
          })),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8 max-w-2xl">
      <BlocksEditor
        blocks={blocks}
        onChange={setBlocks}
        title="texto e fotos do cineclube"
        description="Monte a apresentação em blocos: escreva parágrafos, intercale fotos onde quiser e use as setas ou arraste (⠿) para reorganizar."
      />

      <div className="bg-white rounded-lg p-6 border border-text-dark/10">
        <h3 className="font-display font-bold text-pink text-sm tracking-widest mb-3">EQUIPE/INTEGRANTES/CORPO</h3>

        {team.map((member, i) => (
          <div key={i} className="border border-text-dark/10 rounded p-4 mb-3 flex flex-col gap-3">
            <div className="grid gap-3 md:grid-cols-[1fr,1fr,1fr,auto]">
              <label>
                <span className="font-sans text-xs text-text-dark/70">nome</span>
                <input value={member.name} onChange={(e) => updateMember(i, { name: e.target.value })} className={inputClass} />
              </label>
              <label>
                <span className="font-sans text-xs text-text-dark/70">função (ex.: coordenação, editorial)</span>
                <input value={member.role} onChange={(e) => updateMember(i, { role: e.target.value })} className={inputClass} />
              </label>
              <label>
                <span className="font-sans text-xs text-text-dark/70">e-mail (opcional)</span>
                <input value={member.email ?? ''} onChange={(e) => updateMember(i, { email: e.target.value })} className={inputClass} />
              </label>
              <button
                type="button"
                onClick={() => setTeam((prev) => prev.filter((_, j) => j !== i))}
                aria-label="remover integrante"
                className="text-pink hover:opacity-70 self-end pb-2"
              >
                ✕
              </button>
            </div>

            {/* Redes sociais e contatos do integrante */}
            <div className="pl-3 border-l-2 border-text-dark/10 flex flex-col gap-2">
              <span className="font-sans text-xs text-text-dark/70">
                redes sociais / contato (aparecem como links clicáveis ao lado do nome)
              </span>
              {(member.links ?? []).map((link, j) => (
                <div key={j} className="flex gap-2 items-start">
                  <input
                    value={link.label}
                    onChange={(e) => updateLink(i, j, { label: e.target.value })}
                    placeholder="ex.: Instagram, Letterboxd, site"
                    className={inputClass + ' mt-0 flex-1'}
                  />
                  <input
                    value={link.url}
                    onChange={(e) => updateLink(i, j, { url: e.target.value })}
                    placeholder="https://…"
                    className={inputClass + ' mt-0 flex-[2]'}
                  />
                  <button
                    type="button"
                    onClick={() => removeLink(i, j)}
                    aria-label="remover link"
                    className="text-pink hover:opacity-70 px-1 pt-2"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addLink(i)}
                className="self-start font-display text-xs text-blue-link hover:underline"
              >
                + adicionar link
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => setTeam((prev) => [...prev, { ...emptyMember, links: [] }])}
          className="font-display text-sm text-blue-link hover:underline"
        >
          + adicionar integrante
        </button>
      </div>

      {error && <p className="font-sans text-sm text-pink">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="self-start bg-pink text-white font-display font-bold px-6 py-2 rounded hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {saving ? 'salvando…' : 'salvar'}
      </button>
    </form>
  );
}
