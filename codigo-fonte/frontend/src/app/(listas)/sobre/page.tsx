import type { Metadata } from 'next';
import Link from 'next/link';
import PageShell from '@/components/PageShell';
import Breadcrumb from '@/components/Breadcrumb';
import BlockContent from '@/components/BlockContent';
import Credit from '@/components/Credit';
import { api, ouNulo } from '@/lib/api';
import type { TeamMember } from '@/lib/types';
import { atributosDoLinkDoEditor, linkDoEditorSeguro } from '@/lib/linksDoEditor';

export const metadata: Metadata = {
  title: 'Sobre',
  description: 'Quem faz o Cineclube XHY: apresentação, equipe e contatos.',
  alternates: { canonical: '/sobre' },
};

export default async function SobrePage() {
  // 404 da API = Sobre ainda não preenchido (mostramos o aviso); outras falhas sobem para o error.tsx
  const about = await ouNulo(api.sobre());

  const porFuncao: Record<string, TeamMember[]> = {};
  for (const membro of about?.team ?? []) (porFuncao[membro.role] ||= []).push(membro);

  return (
    <PageShell mainClassName="max-w-3xl">
      <Breadcrumb crumbs={[{ label: 'sobre' }]} />
      <h1 className="sr-only">Sobre o Cineclube XHY</h1>

      <div className="mb-10">
        {about ? (
          about.blocks?.length ? (
            <BlockContent blocks={about.blocks} />
          ) : (
            (about.content ?? '').split('\n').map((p, i) => (
              <p key={i} className="font-serif text-text-dark text-base md:text-lg leading-relaxed mb-3">
                {p}
              </p>
            ))
          )
        ) : (
          <p className="font-serif italic text-text-dark">A apresentação do cineclube ainda não foi publicada.</p>
        )}
      </div>

      <h2 id="equipe" className="font-display font-black text-pink-escuro text-sm tracking-widest mb-6 scroll-mt-6">
        EQUIPE/INTEGRANTES/CORPO
      </h2>

      {Object.entries(porFuncao).map(([funcao, membros]) => (
        <section key={funcao} className="mb-6" aria-label={funcao}>
          <h3 className="font-serif text-text-dark text-sm mb-2">{funcao}</h3>
          {membros.map((membro) => {
            const contatos = [
              ...(membro.email ? [{ chave: 'email', href: `mailto:${membro.email}`, rotulo: membro.email, externo: false }] : []),
              ...(membro.links ?? [])
                .filter((l) => linkDoEditorSeguro(l.url))
                .map((l) => ({ chave: l.label, href: l.url, rotulo: l.label, externo: !l.url.startsWith('mailto:') })),
            ];
            return (
              <div key={membro.name} className="mb-4">
                <p className="font-display font-bold text-text-dark text-sm">{membro.name}</p>
                {contatos.length > 0 && (
                  <ul className="flex flex-wrap items-center gap-y-1 mt-1">
                    {contatos.map((c, i) => (
                      <li key={c.chave} className="flex items-center">
                        {i > 0 && (
                          <span aria-hidden="true" className="text-text-suave text-sm mx-2">
                            ·
                          </span>
                        )}
                        <a
                          href={c.href}
                          {...(c.externo ? atributosDoLinkDoEditor(c.href) : {})}
                          className={`font-serif text-sm hover:underline break-all ${c.externo ? 'text-olive-escuro' : 'text-azul-escuro'}`}
                        >
                          {c.rotulo}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </section>
      ))}

      {/* Desenvolvedor do site, listado junto da equipe */}
      <Credit />

      <p className="font-serif text-text-dark text-base mt-10">
        Quer saber como o site foi construído?{' '}
        <Link href="/como-foi-feito" className="text-azul-escuro underline hover:text-olive-escuro">
          Veja como foi feito
        </Link>
        .
      </p>
    </PageShell>
  );
}
