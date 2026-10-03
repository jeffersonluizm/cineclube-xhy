/** @type {import('next').NextConfig} */

// Permite usar next/image com imagens vindas da API e do Cloudinary
const remotePatterns = [
  { protocol: 'http', hostname: 'localhost', port: '3001' },
  { protocol: 'https', hostname: 'res.cloudinary.com' },
];

try {
  const api = new URL(process.env.NEXT_PUBLIC_API_URL || '');
  if (api.hostname !== 'localhost') {
    remotePatterns.push({ protocol: api.protocol.replace(':', ''), hostname: api.hostname });
  }
} catch {
  // NEXT_PUBLIC_API_URL ausente ou inválida — usa apenas os padrões acima
}

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: { remotePatterns },
};

module.exports = nextConfig;
