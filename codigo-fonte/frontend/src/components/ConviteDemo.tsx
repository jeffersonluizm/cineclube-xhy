import Link from 'next/link';
import { api, ouNulo } from '@/lib/api';

/**
 * Convite para o painel quando a API está em modo demonstração (GET /api/demo responde).
 * Desligado ou API fora do ar: não aparece nada (a página continua inteira).
 */
export default async function ConviteDemo() {
  const demo = await ouNulo(api.demo()).catch(() => null);
  if (!demo) return null;
  return (
    <aside aria-labelledby="convite-demo" className="border-2 border-text-dark bg-papel px-5 py-4 my-8 max-w-2xl">
      <h2 id="convite-demo" className="font-display font-black text-text-dark text-lg mb-1">
        Explore a demonstração
      </h2>
      <p className="font-serif text-text-dark text-base mb-3">
        O painel do editor está aberto para teste com dados de exemplo: crie uma edição, escreva um texto em blocos, reordene,
        exclua. Tudo volta ao original periodicamente.
      </p>
      <Link href="/admin/login" className="font-display font-bold bg-text-dark text-cream px-5 py-2 inline-block hover:bg-dark-purple">
        entrar no painel como editor de demonstração →
      </Link>
    </aside>
  );
}
