import path from 'path';

// Tipos de imagem aceitos no upload e a extensão gravada para cada um
const EXTENSOES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/avif': '.avif',
  'image/svg+xml': '.svg',
};

export function extensaoDaImagem(mimetype: string): string | undefined {
  return EXTENSOES[mimetype];
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
  return { base: base || 'imagem', ext: originalExt.toLowerCase() };
}

/**
 * Nome com que a imagem enviada é gravada em backend/uploads/. A extensão vem do tipo
 * já validado no upload, nunca do nome enviado: um "x.html" com tipo image/png vira "x.png".
 */
export function uploadFileName(originalname: string, mimetype: string, timestamp: number): string {
  const { base } = safeBaseName(originalname);
  return `${timestamp}-${base}${extensaoDaImagem(mimetype) ?? ''}`;
}
