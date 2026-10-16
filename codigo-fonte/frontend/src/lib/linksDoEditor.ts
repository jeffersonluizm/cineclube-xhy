/**
 * Links que o editor cadastra (equipe no Sobre). Só https e mailto (a API já valida; aqui é a
 * segunda barreira). Externos abrem em outra aba sem dar acesso à janela de origem e sem
 * repassar reputação ao destino (nofollow): na demonstração qualquer visitante é editor.
 */
export const linkDoEditorSeguro = (url: string) => /^(https:|mailto:)/i.test(url.trim());

export function atributosDoLinkDoEditor(url: string): { target?: '_blank'; rel?: string } {
  return url.trim().toLowerCase().startsWith('mailto:') ? {} : { target: '_blank', rel: 'noopener noreferrer nofollow' };
}
