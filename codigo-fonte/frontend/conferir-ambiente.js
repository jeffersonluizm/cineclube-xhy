/**
 * Conferência das variáveis no build de produção do site (chamada pelo next.config.js).
 * Devolve erros (o build para) e avisos (o build segue, com o aviso no log).
 *  - NEXT_PUBLIC_API_URL é obrigatória e precisa de https, salvo API local (localhost ou
 *    127.0.0.1: build local, CI e teste de carga).
 *  - SERVIDOR_SEGREDO: com API remota é obrigatório. Sem ele, todo pedido do servidor do
 *    site chega à API como um IP só e cai no limite geral (300/min): sob carga, as páginas
 *    quebram. Por isso falha em vez de só avisar. Com API local, só avisa.
 */
const LOCAIS = new Set(['localhost', '127.0.0.1', '[::1]']);

function conferirAmbienteDoBuild(env) {
  const erros = [];
  const avisos = [];
  const bruta = env.NEXT_PUBLIC_API_URL;
  if (!bruta) {
    erros.push(
      'NEXT_PUBLIC_API_URL não definida. Defina o endereço da API (ex.: https://<api>.onrender.com; ' +
        'para build local, http://localhost:3001 no .env.local).'
    );
    return { erros, avisos };
  }
  let api;
  try {
    api = new URL(bruta);
  } catch {
    erros.push(`NEXT_PUBLIC_API_URL inválida: "${bruta}". Use o endereço completo, com https://.`);
    return { erros, avisos };
  }
  const local = LOCAIS.has(api.hostname);
  if (!local && api.protocol !== 'https:') {
    erros.push(`NEXT_PUBLIC_API_URL precisa de https:// em produção (recebi "${bruta}").`);
  }
  const segredo = env.SERVIDOR_SEGREDO;
  if (!segredo) {
    const texto =
      'SERVIDOR_SEGREDO não definida: o servidor do site vai chegar à API como um IP só e cair no ' +
      'limite geral dela (300/min). Use o mesmo valor configurado na API.';
    if (local) avisos.push(texto);
    else erros.push(texto);
  } else if (!local && segredo.length < 32) {
    erros.push('SERVIDOR_SEGREDO precisa ter pelo menos 32 caracteres (o mesmo valor da API).');
  }
  return { erros, avisos };
}

module.exports = { conferirAmbienteDoBuild };
