import Link from 'next/link';
import { LINKS_PRINCIPAIS, REDES, WHATSAPP } from '@/lib/navegacao';
import { extrasDoPortfolio } from '@/lib/portfolio';
import { ALVO_TOQUE } from '@/lib/toque';
import { LinkPainelDemo } from './DemoContexto';

const externo = { target: '_blank', rel: 'noopener noreferrer' } as const;

/** Rodapé de todas as páginas públicas: navegação, como participar, contato e créditos */
export default function Rodape({ tom = 'cream' }: { tom?: 'cream' | 'dark' }) {
  const escuro = tom === 'dark';
  const texto = escuro ? 'text-cream' : 'text-text-dark';
  const rotulo = escuro ? 'text-pink-claro' : 'text-pink-escuro';
  // No celular cada link é um alvo de toque de 44px; no desktop volta ao tamanho do texto
  const link = `${texto} hover:underline ${escuro ? 'hover:text-olive' : 'hover:text-olive-escuro'} inline-flex items-center ${ALVO_TOQUE}`;
  // "Este site" (como foi feito, painel de demonstração) e o RSS só na demonstração de portfólio
  const extras = extrasDoPortfolio();

  return (
    <footer
      className={`border-t ${escuro ? 'border-cream/15 bg-dark-purple' : 'border-text-dark/15 bg-cream'} px-5 sm:px-8 md:px-10 py-10`}
    >
      <div className={`grid grid-cols-2 gap-x-6 gap-y-8 ${extras ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} max-w-6xl`}>
        <section aria-labelledby="rodape-participe" className="col-span-2 sm:col-span-1">
          <h2 id="rodape-participe" className={`font-display font-black text-xs tracking-widest mb-3 ${rotulo}`}>
            PARTICIPE
          </h2>
          <p className={`font-serif text-base leading-snug mb-3 ${texto}`}>
            As sessões são abertas. A programação e os encontros saem primeiro no grupo e no Instagram.
          </p>
          <ul className="flex flex-col md:gap-1 font-display text-sm">
            <li>
              <a href={WHATSAPP.href} {...externo} className={link}>
                entrar no {WHATSAPP.label} ↗
              </a>
            </li>
            <li>
              <Link href="/ciclos-mostras" className={link}>
                ver a programação das exibições
              </Link>
            </li>
          </ul>
        </section>

        <section aria-labelledby="rodape-contato">
          <h2 id="rodape-contato" className={`font-display font-black text-xs tracking-widest mb-3 ${rotulo}`}>
            CONTATO
          </h2>
          <ul className="flex flex-col md:gap-1 font-display text-sm">
            <li>
              <Link href="/sobre#equipe" className={link}>
                equipe e e-mails
              </Link>
            </li>
            {REDES.map((r) => (
              <li key={r.href}>
                <a href={r.href} {...externo} className={link}>
                  {r.label} ↗
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="rodape-site">
          <h2 id="rodape-site" className={`font-display font-black text-xs tracking-widest mb-3 ${rotulo}`}>
            NO SITE
          </h2>
          <ul className="flex flex-col md:gap-1 font-display text-sm">
            {LINKS_PRINCIPAIS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={link}>
                  {l.label}
                </Link>
              </li>
            ))}
            {extras && (
              <li>
                <a href="/feed.xml" className={link}>
                  RSS dos textos
                </a>
              </li>
            )}
          </ul>
        </section>

        {extras && (
          <section aria-labelledby="rodape-sobre-site" className="col-span-2 sm:col-span-1">
            <h2 id="rodape-sobre-site" className={`font-display font-black text-xs tracking-widest mb-3 ${rotulo}`}>
              ESTE SITE
            </h2>
            <p className={`font-serif text-base leading-snug mb-3 ${texto}`}>
              Revista, catálogos e exibições do Cineclube XHY, com painel de publicação próprio.
            </p>
            <ul className="flex flex-col md:gap-1 font-display text-sm">
              <li>
                <Link href="/como-foi-feito" className={link}>
                  como foi feito →
                </Link>
              </li>
              <LinkPainelDemo className={link} />
            </ul>
          </section>
        )}
      </div>
    </footer>
  );
}
