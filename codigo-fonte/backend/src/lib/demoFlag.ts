/** DEMO_ENABLED ligado? Módulo à parte para quem não deve importar os modelos (ex.: links.ts) */
export function demoLigado(env: NodeJS.ProcessEnv = process.env): boolean {
  return ['true', '1', 'sim'].includes(String(env.DEMO_ENABLED ?? '').toLowerCase());
}
