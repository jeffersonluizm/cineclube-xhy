/**
 * Links que o editor cadastra e o site renderiza em href: só https: e mailto:.
 * Fecha a porta para javascript:, data: e http: (o React 18 só avisa no console).
 */
export function linkSeguro(valor: string): boolean {
  try {
    const url = new URL(valor.trim());
    return url.protocol === 'https:' || url.protocol === 'mailto:';
  } catch {
    return false;
  }
}

import { demoLigado } from './demoFlag';

/** Upload do próprio painel (/uploads/..., /uploads/demo/...) ou capa de exemplo (/demo/...) */
export const imagemPropria = (valor: string) => /^\/(uploads(\/demo)?|demo)\/[\w-]+(\.\w+)?$/.test(valor);

/**
 * Origem de imagem aceita no conteúdo: um upload do painel, uma capa de exemplo ou https.
 * Na demonstração pública (DEMO_ENABLED), só as próprias: um visitante não consegue pôr na
 * home uma imagem hospedada em qualquer lugar.
 */
export function imagemSegura(valor: string, env: NodeJS.ProcessEnv = process.env): boolean {
  if (valor === '' || imagemPropria(valor)) return true;
  return !demoLigado(env) && linkSeguro(valor);
}
