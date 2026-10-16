import path from 'path';

// Tipos de imagem aceitos no upload e a extensão gravada para cada um.
// SVG fica de fora de propósito: é XML e pode carregar <script> quando servido do próprio domínio.
const EXTENSOES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/avif': '.avif',
};

export function extensaoDaImagem(mimetype: string): string | undefined {
  return Object.prototype.hasOwnProperty.call(EXTENSOES, mimetype) ? EXTENSOES[mimetype] : undefined;
}

export function safeBaseName(originalname: string) {
  const originalExt = path.extname(originalname);
  const base = path
    .basename(originalname, originalExt)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 60);
  return { base: base || 'imagem' };
}

/**
 * Nome com que a imagem enviada é gravada em backend/uploads/. A extensão vem do tipo
 * já validado no upload, nunca do nome enviado: um "x.html" com tipo image/png vira "x.png".
 */
export function uploadFileName(originalname: string, mimetype: string, timestamp: number): string {
  const { base } = safeBaseName(originalname);
  return `${timestamp}-${base}${extensaoDaImagem(mimetype) ?? ''}`;
}

/**
 * Tipo real da imagem pelos primeiros bytes (assinatura do formato). O mimetype do upload
 * vem do navegador e pode mentir: um HTML enviado como image/png não passa daqui.
 */
export function tipoPelosBytes(buf: Buffer): string | undefined {
  if (buf.length < 12) return undefined;
  if (buf[0] === 0x89 && buf.toString('latin1', 1, 4) === 'PNG') return 'image/png';
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.toString('latin1', 0, 6) === 'GIF87a' || buf.toString('latin1', 0, 6) === 'GIF89a') return 'image/gif';
  if (buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'WEBP') return 'image/webp';
  if (buf.toString('latin1', 4, 8) === 'ftyp' && /^avi[fs]$/.test(buf.toString('latin1', 8, 12))) return 'image/avif';
  return undefined;
}
