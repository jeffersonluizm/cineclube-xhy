import { createHash, timingSafeEqual } from 'crypto';

const sha256 = (texto: string) => createHash('sha256').update(texto, 'utf8').digest();

/**
 * Compara a senha digitada com a do editor em tempo constante. Os dois lados viram hash
 * SHA-256 antes do timingSafeEqual: os buffers têm sempre 32 bytes, então nem o tamanho
 * da senha vaza pelo tempo de resposta.
 */
export function senhaConfere(digitada: string, correta: string): boolean {
  if (!digitada || !correta) return false;
  return timingSafeEqual(sha256(digitada), sha256(correta));
}
