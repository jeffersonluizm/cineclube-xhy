/** Roda fn até `tentativas` vezes, esperando `esperaMs` entre elas; esgotadas, o último erro sobe */
export async function comTentativas<T>(
  fn: () => Promise<T>,
  {
    tentativas = 3,
    esperaMs = 5000,
    rotulo,
    log = console.warn,
  }: { tentativas?: number; esperaMs?: number; rotulo: string; log?: (m: string) => void }
): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i >= tentativas) throw e;
      log(`Falha ao ${rotulo} (tentativa ${i} de ${tentativas}): ${(e as Error).message}. Tentando de novo em ${esperaMs / 1000} s.`);
      await new Promise((r) => setTimeout(r, esperaMs));
    }
  }
}
