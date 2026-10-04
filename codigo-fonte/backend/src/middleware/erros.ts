import type { NextFunction, Request, RequestHandler, Response } from 'express';
import mongoose from 'mongoose';
import { ZodError } from 'zod';

/** Erro com status HTTP e mensagem pronta para o editor ou o visitante */
export class ErroHttp extends Error {
  constructor(
    public status: number,
    mensagem: string
  ) {
    super(mensagem);
  }
}

export const naoEncontrado = (mensagem: string) => new ErroHttp(404, mensagem);

/** Repassa a rejeição de um handler assíncrono para o tratador de erros (Express 4 não faz isso) */
export const assincrono =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };

export function rotaInexistente(_req: Request, res: Response) {
  res.status(404).json({ error: 'Rota não encontrada' });
}

const ROTULOS: Record<string, string> = {
  number: 'número', volume: 'volume', month: 'mês', year: 'ano', title: 'título', author: 'autor',
  column: 'coluna', blocks: 'blocos', parentId: 'destino', parentType: 'destino', cycleId: 'ciclo',
  ids: 'lista de ids', team: 'equipe', screenings: 'programação', coverImage: 'capa', image: 'imagem',
};

/** Mensagem do primeiro problema de validação; as genéricas ganham o nome do campo em português */
export function mensagemDeValidacao(erro: ZodError): string {
  const primeiro = erro.issues[0];
  if (!/^Entrada inválida/.test(primeiro.message)) return primeiro.message;
  const campo = primeiro.path.map((p) => (typeof p === 'number' ? `#${p + 1}` : ROTULOS[String(p)] ?? String(p))).join(' ');
  return campo ? `${campo}: ${primeiro.message}` : primeiro.message;
}

/**
 * Tratador central: traduz os erros conhecidos para status HTTP e nunca devolve stack.
 * Rotas lançam (ou rejeitam) e este é o único lugar que decide a resposta.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function tratadorDeErros(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ErroHttp) return res.status(err.status).json({ error: err.message });
  if (err instanceof ZodError) return res.status(400).json({ error: mensagemDeValidacao(err) });
  if (err instanceof mongoose.Error.CastError) return res.status(400).json({ error: `Valor inválido para ${err.path}` });
  if (err instanceof mongoose.Error.ValidationError) {
    const primeiro = Object.values(err.errors)[0];
    return res.status(400).json({ error: primeiro?.message ?? 'Dados inválidos' });
  }
  if ((err as { code?: number }).code === 11000) return res.status(409).json({ error: 'Já existe um registro com esse valor' });
  const tipo = (err as { type?: string }).type;
  if (tipo === 'entity.parse.failed') return res.status(400).json({ error: 'JSON inválido no corpo da requisição' });
  if (tipo === 'entity.too.large') return res.status(413).json({ error: 'Corpo da requisição grande demais' });

  console.error('Erro não tratado:', err);
  res.status(500).json({ error: 'Erro interno. Tente novamente em instantes.' });
}
