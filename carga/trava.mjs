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

const DONO = 'dono.json';

/**
 * true se criou a trava; false se outra carga já está com ela. Outros erros sobem.
 * Grava dono.json no mesmo formato do com-trava.sh da oficina ("pid": N, ...), para os
 * outros projetos reconhecerem uma trava abandonada por esta carga.
 */
export function adquirirTrava(caminho, { projeto = 'cineclube', comando = '' } = {}) {
  try {
    fs.mkdirSync(caminho);
  } catch (e) {
    if (e.code === 'EEXIST') return false;
    throw e;
  }
  const inicio = new Date().toISOString();
  const limpo = (t) => String(t).replace(/["\\]/g, '').slice(0, 120);
  fs.writeFileSync(
    path.join(caminho, DONO),
    `{"projeto": "${limpo(projeto)}", "pid": ${process.pid}, "inicio": "${inicio}", "comando": "${limpo(comando)}"}\n`
  );
  return true;
}

export function lerDono(caminho) {
  try {
    return JSON.parse(fs.readFileSync(path.join(caminho, DONO), 'utf8'));
  } catch {
    return null;
  }
}

/** Processo vivo? (process.kill com sinal 0 só consulta) */
export function pidVivo(pid) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return e.code === 'EPERM';
  }
}

/** Órfã: tem dono.json e o dono (e o filho, se houver) já morreu. Sem dono.json, nunca. */
export function travaOrfa(caminho, vivo = pidVivo) {
  const dono = lerDono(caminho);
  if (!dono || !dono.pid) return false;
  if (vivo(dono.pid)) return false;
  if (dono.filho && vivo(dono.filho)) return false;
  return true;
}

export function removerOrfa(caminho) {
  apagarPastaVazia(caminho, true);
}

/**
 * A trava é uma pasta com um dono.json: unlink + rmdirSync. Não use fs.rmSync aqui: no Node 24
 * (Windows) ele volta sem erro e sem apagar quando o caminho tem acento ("portfólio"), e a
 * trava vazava para a próxima carga.
 */
function apagarPastaVazia(caminho, comDono) {
  if (comDono) {
    try {
      fs.unlinkSync(path.join(caminho, DONO));
    } catch (e) {
      if (e.code !== 'ENOENT') throw e;
    }
  }
  try {
    fs.rmdirSync(caminho);
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
  }
}

/** Libera só a trava desta carga (dono.json com o pid deste processo, ou sem dono.json) */
export function liberarTrava(caminho) {
  const dono = lerDono(caminho);
  if (dono && dono.pid !== process.pid) return;
  apagarPastaVazia(caminho, true);
}
