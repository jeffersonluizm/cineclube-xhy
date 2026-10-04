import { revalidateTag } from 'next/cache';
import { API_URL } from '@/lib/media';
import { ETIQUETA_CONTEUDO } from '@/lib/api';

/**
 * Chamado pelo painel depois de salvar: invalida o cache das páginas públicas.
 * O site não conhece o segredo dos tokens; quem confere o token do editor é a API.
 */
export async function POST(req: Request) {
  const autorizacao = req.headers.get('authorization') ?? '';
  if (!autorizacao.startsWith('Bearer ')) return Response.json({ error: 'Não autenticado' }, { status: 401 });

  const sessao = await fetch(`${API_URL}/api/auth/sessao`, { headers: { Authorization: autorizacao }, cache: 'no-store' }).catch(() => null);
  if (!sessao?.ok) return Response.json({ error: 'Sessão inválida' }, { status: 401 });

  revalidateTag(ETIQUETA_CONTEUDO);
  return Response.json({ ok: true, revalidado: ETIQUETA_CONTEUDO });
}
