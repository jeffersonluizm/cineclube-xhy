/** @type {import('next').NextConfig} */

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
  `img-src 'self' data: blob: https://res.cloudinary.com ${origemApi}`.trim(),
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
  images: { remotePatterns },
  async headers() {
    return [{ source: '/:path*', headers: cabecalhosDeSeguranca }];
  },
};

module.exports = nextConfig;
