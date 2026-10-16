// Espera a API responder /api/health com o banco conectado (usado pelo iniciar.bat).
// Termina com código 0 quando a API está pronta e 1 se passar do prazo.
const url = process.argv[2] || 'http://localhost:3001/api/health';
const prazoMs = Number(process.argv[3] || 180_000);

async function apiPronta() {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(5000) });
    return r.ok && (await r.json()).db === 'connected';
  } catch {
    return false; // ainda subindo (na primeira vez o banco embutido é baixado)
  }
}

const inicio = Date.now();
let pontos = 0;
let pronta = false;
while (Date.now() - inicio < prazoMs) {
  if (await apiPronta()) {
    pronta = true;
    break;
  }
  process.stdout.write(++pontos % 10 === 0 ? `. ${Math.round((Date.now() - inicio) / 1000)} s\n` : '.');
  await new Promise((r) => setTimeout(r, 1000));
}

// Sem process.exit(): deixa o Node fechar as conexões sozinho (no Windows, sair à força
// com um fetch recém-encerrado pode disparar uma asserção interna do libuv)
if (pronta) {
  console.log(`\nAPI pronta em ${Math.round((Date.now() - inicio) / 1000)} s.`);
} else {
  console.log(`\nA API não respondeu em ${prazoMs / 1000} s. Veja a janela "Cineclube XHY - API".`);
  process.exitCode = 1;
}
