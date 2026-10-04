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
    problemas.push('JWT_SECRET precisa ter pelo menos 32 caracteres (gere com: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))")');
  }
  if (env.SERVIDOR_SEGREDO !== undefined && env.SERVIDOR_SEGREDO.length < 32) {
    problemas.push('SERVIDOR_SEGREDO precisa ter pelo menos 32 caracteres');
  }
  return problemas;
}
