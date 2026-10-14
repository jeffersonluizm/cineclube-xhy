import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { rateLimit } from 'express-rate-limit';
import { limitadorUpload } from '../middleware/limitadores';
import { demoLigado, pastaUploadsDemonstracao } from '../lib/demo';
import { pastaUploads } from '../lib/uploads';
import { extensaoDaImagem, safeBaseName, tipoPelosBytes, uploadFileName } from '../lib/imagem';

/**
 * Armazenamento das imagens:
 *  - Com CLOUDINARY_URL definida → envia para o Cloudinary (persistente, com CDN).
 *    Obrigatório em hospedagens com disco efêmero (Render, Vercel, Koyeb...).
 *  - Sem CLOUDINARY_URL → salva em backend/uploads/ (apenas desenvolvimento local
 *    ou servidores com disco persistente). UPLOADS_DIR troca a pasta (usado nos testes).
 * O arquivo fica em memória até o tipo ser confirmado pelos bytes: nada inválido toca o disco.
 *
 * Na demonstração pública (DEMO_ENABLED) o upload é contido: até 2 MB, poucas imagens por
 * hora por IP, sempre em disco na pasta uploads/demo (nunca no Cloudinary), que o reset apaga.
 */
const FORMATOS = 'jpg, png, webp, gif, avif';
const CLOUDINARY_FOLDER = process.env.CLOUDINARY_FOLDER || 'cineclube-xhy';

export const LIMITE_UPLOAD_MB = 10;
export const LIMITE_UPLOAD_DEMO_MB = 2;
export const ENVIOS_DEMO_POR_HORA = 10;

const criarMulter = (limiteMb: number) =>
  multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: limiteMb * 1024 * 1024, files: 1, fields: 5 },
    fileFilter: (_req, file, cb) => {
      if (extensaoDaImagem(file.mimetype)) cb(null, true);
      else cb(new Error(`Apenas imagens são permitidas (${FORMATOS})`));
    },
  });

/** Erros do multer em português (o padrão dele é inglês, ex.: "File too large") */
function erroDoMulter(err: unknown, limiteMb: number): { status: number; error: string } {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') return { status: 413, error: `A imagem passa do limite de ${limiteMb} MB.` };
    return { status: 400, error: 'Envie uma imagem por vez, no campo "image".' };
  }
  return { status: 400, error: (err as Error).message };
}

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
  /** demonstração pública: upload contido (padrão: DEMO_ENABLED) */
  demo?: boolean;
}

/** Rota de upload; as opções existem para os testes trocarem destino e armazenamento */
export function criarRotaUpload({
  pasta: pastaBase = pastaUploads(),
  usarCloudinary: cloudinaryPedido = Boolean(process.env.CLOUDINARY_URL),
  demo = demoLigado(),
}: OpcoesUpload = {}) {
  const usarCloudinary = cloudinaryPedido && !demo;
  const pasta = demo ? pastaUploadsDemonstracao(pastaBase) : pastaBase;
  const prefixoUrl = demo ? '/uploads/demo' : '/uploads';
  const limiteMb = demo ? LIMITE_UPLOAD_DEMO_MB : LIMITE_UPLOAD_MB;
  const upload = criarMulter(limiteMb);
  const limites = [limitadorUpload];
  if (demo) {
    limites.push(
      rateLimit({
        windowMs: 60 * 60 * 1000,
        limit: ENVIOS_DEMO_POR_HORA,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
        message: { error: `Na demonstração cada visitante envia até ${ENVIOS_DEMO_POR_HORA} imagens por hora. Tente mais tarde.` },
      })
    );
  }
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
  router.post('/', ...limites, requireAuth, (req: AuthRequest, res: Response) => {
    upload.single('image')(req, res, async (err) => {
      if (err) {
        const { status, error } = erroDoMulter(err, limiteMb);
        return res.status(status).json({ error });
      }
      if (!req.file) return res.status(400).json({ error: 'Nenhuma imagem enviada' });

      // O tipo declarado pelo navegador só passou no filtro; quem decide é a assinatura do arquivo
      const tipoReal = tipoPelosBytes(req.file.buffer);
      if (!tipoReal) return res.status(400).json({ error: `O arquivo não é uma imagem válida (${FORMATOS})` });

      if (!usarCloudinary) {
        const nome = uploadFileName(req.file.originalname, tipoReal, Date.now());
        try {
          // a pasta da demonstração some a cada reset: recria antes de gravar
          await fs.promises.mkdir(pasta, { recursive: true });
          await fs.promises.writeFile(path.join(pasta, nome), req.file.buffer);
        } catch (gravacao) {
          // Sem tratamento, a rejeição dentro do callback do multer derrubaria o processo
          console.error('Erro ao gravar a imagem em disco:', gravacao);
          return res.status(500).json({ error: 'Não foi possível guardar a imagem no servidor. Tente de novo.' });
        }
        return res.json({ url: `${prefixoUrl}/${nome}` });
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
