import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { extensaoDaImagem, safeBaseName, uploadFileName } from '../lib/imagem';

const router = Router();

/**
 * Armazenamento das imagens:
 *  - Com CLOUDINARY_URL definida → envia para o Cloudinary (persistente, com CDN).
 *    Obrigatório em hospedagens com disco efêmero (Render, Vercel, Koyeb...).
 *  - Sem CLOUDINARY_URL → salva em backend/uploads/ (apenas desenvolvimento local
 *    ou servidores com disco persistente).
 */
const USE_CLOUDINARY = Boolean(process.env.CLOUDINARY_URL);
const CLOUDINARY_FOLDER = process.env.CLOUDINARY_FOLDER || 'cineclube-xhy';

if (USE_CLOUDINARY) {
  // O SDK lê CLOUDINARY_URL automaticamente; aqui só forçamos URLs https
  cloudinary.config({ secure: true });
}

const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');
if (!USE_CLOUDINARY && !fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => cb(null, uploadFileName(file.originalname, file.mimetype, Date.now())),
});

const upload = multer({
  storage: USE_CLOUDINARY ? multer.memoryStorage() : diskStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (extensaoDaImagem(file.mimetype)) cb(null, true);
    else cb(new Error('Apenas imagens são permitidas (jpg, png, webp, gif, avif, svg)'));
  },
});

function uploadToCloudinary(file: Express.Multer.File): Promise<string> {
  const { base } = safeBaseName(file.originalname);
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: CLOUDINARY_FOLDER,
        public_id: `${Date.now()}-${base}`,
        resource_type: 'image',
        overwrite: false,
      },
      (err, result) => {
        if (err || !result) return reject(err ?? new Error('Falha no upload para o Cloudinary'));
        resolve(result.secure_url);
      }
    );
    stream.end(file.buffer);
  });
}

router.post('/', requireAuth, (req: AuthRequest, res: Response) => {
  upload.single('image')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Nenhuma imagem enviada' });

    if (!USE_CLOUDINARY) {
      return res.json({ url: `/uploads/${req.file.filename}` });
    }

    try {
      const url = await uploadToCloudinary(req.file);
      res.json({ url });
    } catch (uploadErr) {
      console.error('Erro no upload para o Cloudinary:', uploadErr);
      res.status(502).json({ error: 'Não foi possível enviar a imagem. Tente novamente.' });
    }
  });
});

export default router;
