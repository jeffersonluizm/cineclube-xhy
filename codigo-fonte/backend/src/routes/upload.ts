import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { limitadorUpload } from '../middleware/limitadores';
import { pastaUploads } from '../lib/uploads';
import { extensaoDaImagem, safeBaseName, tipoPelosBytes, uploadFileName } from '../lib/imagem';

/**
 * Armazenamento das imagens:
 *  - Com CLOUDINARY_URL definida → envia para o Cloudinary (persistente, com CDN).
 *    Obrigatório em hospedagens com disco efêmero (Render, Vercel, Koyeb...).
 *  - Sem CLOUDINARY_URL → salva em backend/uploads/ (apenas desenvolvimento local
 *    ou servidores com disco persistente). UPLOADS_DIR troca a pasta (usado nos testes).
 * O arquivo fica em memória até o tipo ser confirmado pelos bytes: nada inválido toca o disco.
 */
const FORMATOS = 'jpg, png, webp, gif, avif';
const CLOUDINARY_FOLDER = process.env.CLOUDINARY_FOLDER || 'cineclube-xhy';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 5 },
  fileFilter: (_req, file, cb) => {
    if (extensaoDaImagem(file.mimetype)) cb(null, true);
    else cb(new Error(`Apenas imagens são permitidas (${FORMATOS})`));
  },
});

function uploadToCloudinary(file: Express.Multer.File): Promise<string> {
  const { base } = safeBaseName(file.originalname);
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: CLOUDINARY_FOLDER, public_id: `${Date.now()}-${base}`, resource_type: 'image', overwrite: false },
      (err, result) => {
        if (err || !result) return reject(err ?? new Error('Falha no upload para o Cloudinary'));
        resolve(result.secure_url);
      }
    );
    stream.end(file.buffer);
  });
}

interface OpcoesUpload {
  pasta?: string;
  usarCloudinary?: boolean;
}

/** Rota de upload; as opções existem para os testes trocarem destino e armazenamento */
export function criarRotaUpload({ pasta = pastaUploads(), usarCloudinary = Boolean(process.env.CLOUDINARY_URL) }: OpcoesUpload = {}) {
  if (usarCloudinary) {
    // O SDK lê CLOUDINARY_URL automaticamente; aqui só forçamos URLs https
    cloudinary.config({ secure: true });
  } else {
    try {
      fs.mkdirSync(pasta, { recursive: true });
    } catch {
      /* pasta inválida: o erro aparece (500) na hora de gravar, sem derrubar a API */
    }
  }

  const router = Router();
  router.post('/', limitadorUpload, requireAuth, (req: AuthRequest, res: Response) => {
    upload.single('image')(req, res, async (err) => {
      if (err) return res.status(400).json({ error: err.message });
      if (!req.file) return res.status(400).json({ error: 'Nenhuma imagem enviada' });

      // O tipo declarado pelo navegador só passou no filtro; quem decide é a assinatura do arquivo
      const tipoReal = tipoPelosBytes(req.file.buffer);
      if (!tipoReal) return res.status(400).json({ error: `O arquivo não é uma imagem válida (${FORMATOS})` });

      if (!usarCloudinary) {
        const nome = uploadFileName(req.file.originalname, tipoReal, Date.now());
        try {
          await fs.promises.writeFile(path.join(pasta, nome), req.file.buffer);
        } catch (gravacao) {
          // Sem tratamento, a rejeição dentro do callback do multer derrubaria o processo
          console.error('Erro ao gravar a imagem em disco:', gravacao);
          return res.status(500).json({ error: 'Não foi possível guardar a imagem no servidor. Tente de novo.' });
        }
        return res.json({ url: `/uploads/${nome}` });
      }

      try {
        res.json({ url: await uploadToCloudinary(req.file) });
      } catch (uploadErr) {
        console.error('Erro no upload para o Cloudinary:', uploadErr);
        res.status(502).json({ error: 'Não foi possível enviar a imagem. Tente novamente.' });
      }
    });
  });
  return router;
}

export default criarRotaUpload();
