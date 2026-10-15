import express, { type NextFunction, type Request, type Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import type { Model } from 'mongoose';
import Magazine from '../models/Magazine';
import Article from '../models/Article';
import Catalog from '../models/Catalog';
import Cycle from '../models/Cycle';
import Film from '../models/Film';
import { demoLigado } from '../lib/demo';

/**
 * Contenção de volume da demonstração pública (DEMO_ENABLED): sem contas, qualquer visitante
 * é editor, então o banco precisa de teto. Fora da demonstração nada daqui atua.
 */

// Model<any>: só usamos countDocuments, igual em todos os modelos
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Teto = { modelo: Model<any>; nome: string; variavel: string; padrao: number };
export const TETOS_DEMO: Record<'revistas' | 'textos' | 'catalogos' | 'ciclos' | 'filmes', Teto> = {
  revistas: { modelo: Magazine, nome: 'revistas', variavel: 'DEMO_TETO_REVISTAS', padrao: 50 },
  textos: { modelo: Article, nome: 'textos', variavel: 'DEMO_TETO_TEXTOS', padrao: 300 },
  catalogos: { modelo: Catalog, nome: 'catálogos', variavel: 'DEMO_TETO_CATALOGOS', padrao: 50 },
  ciclos: { modelo: Cycle, nome: 'exibições', variavel: 'DEMO_TETO_EXIBICOES', padrao: 50 },
  filmes: { modelo: Film, nome: 'filmes', variavel: 'DEMO_TETO_FILMES', padrao: 300 },
};

const numero = (valor: string | undefined, padrao: number) => (valor && Number(valor) > 0 ? Number(valor) : padrao);

/** Antes de criar: na demonstração, recusa (409) quando a coleção chegou ao teto */
export function tetoDemo(chave: keyof typeof TETOS_DEMO) {
  const { modelo, nome, variavel, padrao } = TETOS_DEMO[chave];
  return async (_req: Request, res: Response, next: NextFunction) => {
    if (!demoLigado()) return next();
    try {
      const teto = numero(process.env[variavel], padrao);
      if ((await modelo.countDocuments()) >= teto) {
        return res
          .status(409)
          .json({ error: `A demonstração chegou ao limite de ${teto} ${nome}. Exclua alguma ou espere o próximo reset.` });
      }
      next();
    } catch (e) {
      next(e);
    }
  };
}

/** Corpo JSON: 256 kB na demonstração (um texto grande de verdade tem bem menos), 2 MB fora dela */
const jsonNormal = express.json({ limit: '2mb' });
const jsonDemo = express.json({ limit: '256kb' });
export const corpoJson = (req: Request, res: Response, next: NextFunction) => (demoLigado() ? jsonDemo : jsonNormal)(req, res, next);

/** Escritas por IP por hora na demonstração (DEMO_ESCRITAS_POR_HORA, padrão 60); leituras não contam */
export function criarLimitadorEscritaDemo(env: NodeJS.ProcessEnv = process.env) {
  return rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: () => numero(env.DEMO_ESCRITAS_POR_HORA, 60),
    skip: (req) => !demoLigado(env) || ['GET', 'HEAD', 'OPTIONS'].includes(req.method),
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: () => ({
      error: `Na demonstração cada visitante faz até ${numero(env.DEMO_ESCRITAS_POR_HORA, 60)} alterações por hora. Tente mais tarde.`,
    }),
  });
}
