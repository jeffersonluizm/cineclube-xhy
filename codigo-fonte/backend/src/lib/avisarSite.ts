import { signToken } from '../middleware/auth';

/**
 * Pede ao site (FRONTEND_URL, uma ou mais origens) para invalidar o cache das páginas, como
 * o painel faz depois de salvar. Melhor esforço: site fora do ar não impede nada.
 */
export async function avisarSite(env: NodeJS.ProcessEnv = process.env, buscar: typeof fetch = fetch): Promise<void> {
  const sites = (env.FRONTEND_URL ?? '')
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);
  if (sites.length === 0) return;
  const token = signToken();
  await Promise.all(
    sites.map((site) =>
      buscar(`${site}/api/revalidar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(10_000),
      }).catch(() => null)
    )
  );
}
