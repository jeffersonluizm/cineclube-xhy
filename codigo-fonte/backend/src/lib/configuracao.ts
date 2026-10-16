/**
 * Configuração validada na partida. Em produção a API se recusa a subir com variável
 * obrigatória faltando ou segredo fraco, com uma mensagem que diz o que corrigir.
 */
export function problemasDeConfiguracao(env: NodeJS.ProcessEnv = process.env): string[] {
  if (env.NODE_ENV !== 'production') return [];
  const problemas: string[] = [];
  for (const nome of ['MONGODB_URI', 'ADMIN_PASSWORD', 'JWT_SECRET', 'FRONTEND_URL']) {
    if (!env[nome]) problemas.push(`${nome} não definida`);
  }
  if (env.ADMIN_PASSWORD && env.ADMIN_PASSWORD.length < 12) {
    problemas.push('ADMIN_PASSWORD precisa ter pelo menos 12 caracteres');
  }
  if (env.JWT_SECRET && env.JWT_SECRET.length < 32) {
    problemas.push(
      "JWT_SECRET precisa ter pelo menos 32 caracteres (gere com: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\")"
    );
  }
  // Sem o segredo, todo pedido do servidor do site chega como um IP só e cai no limite geral
  // (300/min): sob carga, as páginas do site quebram. Em produção isso impede a partida.
  if (!env.SERVIDOR_SEGREDO) {
    problemas.push(
      'SERVIDOR_SEGREDO não definida: o site cairia no limite geral por IP desta API sob carga. Defina o mesmo valor na API e no site.'
    );
  } else if (env.SERVIDOR_SEGREDO.length < 32) {
    problemas.push('SERVIDOR_SEGREDO precisa ter pelo menos 32 caracteres');
  }
  return problemas;
}
