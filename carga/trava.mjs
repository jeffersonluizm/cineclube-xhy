// Trava compartilhada da oficina: só uma carga por vez na máquina.
//
// O caminho precisa ser ABSOLUTO. Até o commit 6332309 ele estava numa string JS comum com
// barras invertidas simples ('E:\Faculdade\...'), que o JavaScript lê como
// 'E:FaculdadeProjeto - ...martorelli-oficina.carga-lock': um caminho relativo à pasta atual da
// unidade E:. A carga criava essa pasta errada e nunca enxergava a trava das outras cargas.
import fs from 'node:fs';
import path from 'node:path';

export const TRAVA_PADRAO = String.raw`E:\Faculdade\Projeto - Faculdade\Projetos do portfólio\martorelli-oficina\.carga-lock`;

export function caminhoDaTrava(env = process.env) {
  const caminho = env.CARGA_TRAVA || TRAVA_PADRAO;
  if (!path.isAbsolute(caminho)) {
    throw new Error(`A trava de carga precisa de um caminho absoluto, recebi "${caminho}".`);
  }
  return caminho;
}

/** true se criou a trava; false se outra carga já está com ela. Outros erros sobem. */
export function adquirirTrava(caminho) {
  try {
    fs.mkdirSync(caminho);
    return true;
  } catch (e) {
    if (e.code === 'EEXIST') return false;
    throw e;
  }
}

export function liberarTrava(caminho) {
  fs.rmSync(caminho, { recursive: true, force: true });
}
