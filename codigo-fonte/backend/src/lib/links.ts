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

/** Origem de imagem aceita no conteúdo: https, um upload local (/uploads/...) ou uma capa de demonstração (/demo/...) */
export function imagemSegura(valor: string): boolean {
  return valor === '' || /^\/(uploads|demo)\/[\w-]+(\.\w+)?$/.test(valor) || linkSeguro(valor);
}
