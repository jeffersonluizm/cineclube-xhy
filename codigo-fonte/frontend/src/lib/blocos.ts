import type { Block } from './types';

let contador = 0;
const novaChave = () => `b${Date.now().toString(36)}${(contador++).toString(36)}`;

/**
 * Chave estável de cada bloco no editor (React key e alvo de atualizações assíncronas, como
 * o fim de um upload): o índice muda quando o editor reordena ou remove blocos.
 */
export function comChaves(blocos: Block[]): Block[] {
  return blocos.map((b) => (b._k ? b : { ...b, _k: novaChave() }));
}

/** Tira a chave do editor antes de enviar à API */
export function semChaves(blocos: Block[]): Block[] {
  return blocos.map(({ _k, ...resto }) => (void _k, resto));
}

export const blocoNovo = (type: Block['type']): Block =>
  type === 'image' ? { type, src: '', align: 'full', width: 'large', _k: novaChave() } : { type, text: '', _k: novaChave() };
