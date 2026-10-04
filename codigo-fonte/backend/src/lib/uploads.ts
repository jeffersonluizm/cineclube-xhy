import path from 'path';

/** Pasta das imagens enviadas sem Cloudinary (backend/uploads). UPLOADS_DIR troca nos testes. */
export const pastaUploads = () => process.env.UPLOADS_DIR || path.resolve(__dirname, '../../uploads');
