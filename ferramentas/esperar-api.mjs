// Espera a API responder /api/health com o banco conectado (usado pelo iniciar.bat).
// Sai com 0 quando a API está pronta e 1 se passar do prazo.
const url = process.argv[2] || 'http://localhost:3001/api/health';
const prazoMs = Number(process.argv[3] || 180_000);
const inicio = Date.now();
let pontos = 0;

while (Date.now() - inicio < prazoMs) {
  try {
    const r = await fetch(url);
    if (r.ok && (await r.json()).db === 'connected') {
      console.log(`\nAPI pronta em ${Math.round((Date.now() - inicio) / 1000)} s.`);
      process.exit(0);
    }
  } catch {
    // ainda subindo (na primeira vez o banco embutido é baixado, pode levar alguns minutos)
  }
  process.stdout.write(++pontos % 10 === 0 ? `. ${Math.round((Date.now() - inicio) / 1000)} s\n` : '.');
  await new Promise((r) => setTimeout(r, 1000));
}
console.log(`\nA API não respondeu em ${prazoMs / 1000} s. Veja a janela "Cineclube XHY - API".`);
process.exit(1);
