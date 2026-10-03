import type { Metadata } from 'next';
import PageShell from '@/components/PageShell';
import Breadcrumb from '@/components/Breadcrumb';
import BlockContent from '@/components/BlockContent';
import Credit from '@/components/Credit';
import { api } from '@/lib/api';
import { TeamMember } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Sobre',
  description: 'Quem faz o Cineclube XHY: apresentação, equipe e contatos.',
  alternates: { canonical: '/sobre' },
};

export default async function SobrePage() {
  let about;
  try {
    about = await api.sobre();
  } catch {
    about = null;
  }

  const roleGroups: Record<string, TeamMember[]> = {};
  if (about) {
    for (const member of about.team) {
      if (!roleGroups[member.role]) roleGroups[member.role] = [];
      roleGroups[member.role].push(member);
    }
  }

  return (
    <PageShell mainClassName="max-w-3xl">
      <Breadcrumb crumbs={[{ label: 'sobre' }]} />

      {about ? (
        <>
          <div className="mb-10">
            {about.blocks?.length ? (
              <BlockContent blocks={about.blocks} />
            ) : (
              about.content.split('\n').map((p, i) => (
                <p key={i} className="font-serif text-text-dark text-base md:text-lg leading-relaxed mb-3">
                  {p}
                </p>
              ))
            )}
          </div>

          <h2 className="font-display font-black text-pink text-sm tracking-widest mb-6">
            EQUIPE/INTEGRANTES/CORPO
          </h2>

          {Object.entries(roleGroups).map(([role, members]) => (
            <section key={role} className="mb-6">
              <p className="font-serif text-text-dark text-sm mb-2">{role}</p>
              {members.map((member) => {
                const contacts = [
                  ...(member.email
                    ? [{ key: 'email', href: `mailto:${member.email}`, label: member.email, external: false }]
                    : []),
                  ...(member.links ?? []).map((link) => ({
                    key: link.label,
                    href: link.url,
                    label: link.label,
                    external: true,
                  })),
                ];

                return (
                  <div key={member.name} className="mb-4">
                    <p className="font-display font-bold text-text-dark text-sm">{member.name}</p>
                    {contacts.length > 0 && (
                      <div className="flex flex-wrap items-center gap-y-1 mt-1">
                        {contacts.map((contact, i) => (
                          <span key={contact.key} className="flex items-center">
                            {i > 0 && <span className="text-text-dark/30 text-sm mx-2">·</span>}
                            <a
                              href={contact.href}
                              {...(contact.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                              className={`font-serif text-sm hover:underline break-all ${
                                contact.external ? 'text-olive' : 'text-blue-link'
                              }`}
                            >
                              {contact.label}
                            </a>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </section>
          ))}
        </>
      ) : (
        <>
          <p className="font-serif italic text-text-dark mb-10">Informações não disponíveis.</p>
          <h2 className="font-display font-black text-pink text-sm tracking-widest mb-6">
            EQUIPE/INTEGRANTES/CORPO
          </h2>
        </>
      )}

      {/* Desenvolvedor do site, listado junto da equipe */}
      <Credit />
    </PageShell>
  );
}
