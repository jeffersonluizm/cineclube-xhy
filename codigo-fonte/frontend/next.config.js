const { PHASE_PRODUCTION_BUILD } = require('next/constants');
const { conferirAmbienteDoBuild } = require('./conferir-ambiente');

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const DEV = process.env.NODE_ENV !== 'production';

// next/image só otimiza imagens destas origens: a API, a conta do Cloudinary do cineclube
// (CLOUDINARY_CLOUD_NAME, variável de build) e, só em desenvolvimento, a API local
const remotePatterns = [];
if (DEV) remotePatterns.push({ protocol: 'http', hostname: 'localhost', port: '3001' });
if (process.env.CLOUDINARY_CLOUD_NAME) {
  remotePatterns.push({ protocol: 'https', hostname: 'res.cloudinary.com', pathname: `/${process.env.CLOUDINARY_CLOUD_NAME}/**` });
}

let origemApi = '';
try {
  const api = new URL(API_URL);
  origemApi = api.origin;
  if (api.hostname !== 'localhost') {
    remotePatterns.push({ protocol: api.protocol.replace(':', ''), hostname: api.hostname });
  }
} catch {
  // NEXT_PUBLIC_API_URL inválida: usa apenas os padrões acima
}

/**
 * Política de conteúdo: scripts e estilos só do próprio site (o Next ainda injeta scripts
 * inline, por isso 'unsafe-inline'; um nonce obrigaria toda página a ser dinâmica e acabaria
 * com o cache), imagens do site, da API e do Cloudinary, e chamadas só para a API.
 * Sem frames de terceiros, sem <object>, sem formulários para outros domínios.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${DEV ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  // a API aceita imagens de qualquer endereço https (links.ts): a CSP segue a mesma regra
  `img-src 'self' data: blob: https: ${origemApi}`.trim(),
  "font-src 'self' data:",
  `connect-src 'self' ${origemApi}${DEV ? ' ws:' : ''}`.trim(),
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

const cabecalhosDeSeguranca = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Otimizador de imagens desligado: o site não depende dele e ele concentra advisories
  // ainda sem correção na linha 14 do Next (ver docs/adr/0006). O middleware responde 404 em /_next/image.
  images: { unoptimized: true, remotePatterns },
  // Cache de páginas no navegador (navegação por <Link>) com os mesmos tempos do Next 14:
  // o Next 15 zerou o das páginas dinâmicas (era 30 s); o das estáticas continua 5 min.
  experimental: { staleTimes: { dynamic: 30, static: 300 } },
  async headers() {
    return [{ source: '/:path*', headers: cabecalhosDeSeguranca }];
  },
};

/** @type {(fase: string) => import('next').NextConfig} */
module.exports = (fase) => {
  // Build de produção com configuração que quebraria o site: para aqui, com a explicação.
  // Outros comandos (como `next typegen`) também carregam a config; a conferência vale só para `next build`.
  if (fase === PHASE_PRODUCTION_BUILD && process.argv.includes('build')) {
    const { erros, avisos } = conferirAmbienteDoBuild(process.env);
    for (const aviso of avisos) console.warn(`AVISO: ${aviso}`);
    if (erros.length) {
      throw new Error(`Configuração inválida para o build de produção do site:\n- ${erros.join('\n- ')}`);
    }
  }
  return nextConfig;
};
