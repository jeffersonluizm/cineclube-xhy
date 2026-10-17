import { revalidateTag } from 'next/cache';
import { API_URL } from '@/lib/media';
import { cabecalhosDoServidor, ETIQUETA_CONTEUDO } from '@/lib/api';
import { tokenPareceValido } from '@/lib/sessao';

/**
 * Chamado pelo painel depois de salvar: invalida o cache das páginas públicas.
 * O site não conhece o segredo dos tokens; quem confere o token do editor é a API.
 */
export async function POST(req: Request) {
  const autorizacao = req.headers.get('authorization') ?? '';
  // Filtro barato antes de incomodar a API: precisa ter formato de JWT e não estar vencido
  if (!autorizacao.startsWith('Bearer ') || !tokenPareceValido(autorizacao.slice(7))) {
    return Response.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const sessao = await fetch(`${API_URL}/api/auth/sessao`, {
    headers: { Authorization: autorizacao, ...cabecalhosDoServidor() },
    cache: 'no-store',
  }).catch(() => null);
  if (!sessao?.ok) return Response.json({ error: 'Sessão inválida' }, { status: 401 });

  // { expire: 0 }: o cache da etiqueta expira na hora e a próxima visita já busca o conteúdo
  // novo (o mesmo comportamento do Next 14). O perfil 'max' serviria a versão antiga mais uma vez.
  revalidateTag(ETIQUETA_CONTEUDO, { expire: 0 });
  return Response.json({ ok: true, revalidado: ETIQUETA_CONTEUDO });
}
