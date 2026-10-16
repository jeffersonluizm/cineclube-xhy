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

const FAIXA = { min: 1, max: 10_000 };

/** Inteiro finito na faixa; Infinity, 1e9, frações e texto desligariam o teto e são recusados */
function lerInteiro(valor: string | undefined, padrao: number): { valor: number; valido: boolean } {
  if (valor === undefined || valor.trim() === '') return { valor: padrao, valido: true };
  const n = Number(valor);
  const valido = /^\d+$/.test(valor.trim()) && Number.isSafeInteger(n) && n >= FAIXA.min && n <= FAIXA.max;
  return { valor: valido ? n : padrao, valido };
}
const numero = (valor: string | undefined, padrao: number) => lerInteiro(valor, padrao).valor;

const ESCRITAS = { variavel: 'DEMO_ESCRITAS_POR_HORA', padrao: 60 };

/**
 * Valores efetivos dos limites da demonstração e problemas de configuração (a API não parte
 * com eles). O resumo vai para o log da partida.
 */
export function limitesDaDemonstracao(env: NodeJS.ProcessEnv = process.env) {
  const valores: Record<string, number> = {};
  const problemas: string[] = [];
  for (const { variavel, padrao } of [...Object.values(TETOS_DEMO), ESCRITAS]) {
    const lido = lerInteiro(env[variavel], padrao);
    valores[variavel] = lido.valor;
    if (!lido.valido) problemas.push(`${variavel}="${env[variavel]}" inválida: use um inteiro entre ${FAIXA.min} e ${FAIXA.max}.`);
  }
  const tetos = Object.values(TETOS_DEMO)
    .map((t) => `${t.nome} ${valores[t.variavel]}`)
    .join(', ');
  const resumo = `tetos: ${tetos}; ${valores[ESCRITAS.variavel]} escritas por hora por IP`;
  return { valores, problemas, resumo };
}

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
