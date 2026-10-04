/**
 * Limitador em memória por chave (IP do visitante), janela fixa. Roda no middleware do Next:
 * em hospedagem serverless cada instância tem a sua memória, então é uma contenção de
 * melhor esforço; o limite de verdade da API continua valendo para quem a chama direto.
 */
export function criarLimitador({ limite, janelaMs }: { limite: number; janelaMs: number }) {
  const janelas = new Map<string, { inicio: number; usados: number }>();
  return function permitir(chave: string, agora = Date.now()): boolean {
    const atual = janelas.get(chave);
    if (!atual || agora - atual.inicio >= janelaMs) {
      janelas.set(chave, { inicio: agora, usados: 1 });
      if (janelas.size > 10_000) {
        // limpeza simples para a memória não crescer sem fim
        janelas.forEach((v, k) => {
          if (agora - v.inicio >= janelaMs) janelas.delete(k);
        });
      }
      return true;
    }
    atual.usados += 1;
    return atual.usados <= limite;
  };
}
