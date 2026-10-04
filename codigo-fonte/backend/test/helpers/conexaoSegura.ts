import { conectarBanco, OpcoesConexao } from '../../src/lib/banco';

/**
 * Conecta só na URI dada. Com producao: true não existe fallback: se a conexão falhar
 * (ex.: máquina lenta), o teste falha em vez de cair no banco embutido de desenvolvimento
 * (porta 27018, backend/data/db). O timeout é folgado para máquinas sob carga.
 */
export function conectarSoNaUri(uri: string, extra: Pick<OpcoesConexao, 'log'> = {}) {
  return conectarBanco({ uri, producao: true, timeoutMs: 30000, log: () => {}, ...extra });
}
