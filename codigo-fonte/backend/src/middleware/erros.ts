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

/** Nome em português de cada campo que o editor envia (nunca o nome técnico em inglês) */
export const ROTULOS: Record<string, string> = {
  number: 'número',
  volume: 'volume',
  month: 'mês',
  year: 'ano',
  title: 'título',
  subtitle: 'subtítulo',
  slug: 'endereço',
  author: 'autor',
  authorFootnote: 'nota do autor',
  column: 'coluna',
  blocks: 'blocos',
  type: 'tipo',
  text: 'texto',
  src: 'imagem',
  caption: 'legenda',
  align: 'alinhamento',
  width: 'largura',
  content: 'texto',
  description: 'descrição',
  editorial: 'editorial',
  epigraph: 'epígrafe',
  footnotes: 'notas',
  synopsis: 'sinopse',
  director: 'direção',
  duration: 'duração',
  country: 'país',
  date: 'data',
  time: 'horário',
  filmId: 'filme',
  filmSlug: 'filme',
  filmTitle: 'título do filme',
  parentId: 'destino',
  parentType: 'destino',
  cycleId: 'exibição',
  ids: 'lista de ids',
  team: 'equipe',
  name: 'nome',
  role: 'função',
  email: 'e-mail',
  links: 'links',
  label: 'rótulo',
  url: 'endereço',
  screenings: 'programação',
  coverImage: 'capa',
  image: 'imagem',
  published: 'publicado',
  order: 'ordem',
  _id: 'identificador',
};

const rotulo = (campo: string) => ROTULOS[campo] ?? 'campo';

/** Mensagem do primeiro problema de validação; as genéricas ganham o nome do campo em português */
export function mensagemDeValidacao(erro: ZodError): string {
  const primeiro = erro.issues[0];
  if (!/^Entrada inválida/.test(primeiro.message)) return primeiro.message;
  const campo = primeiro.path.map((p) => (typeof p === 'number' ? `#${p + 1}` : rotulo(String(p)))).join(' ');
  return campo ? `${campo}: ${primeiro.message}` : primeiro.message;
}

/** Erro de validação do Mongoose (última barreira, depois do zod) em português */
function mensagemDoMongoose(err: mongoose.Error.ValidationError): string {
  const primeiro = Object.values(err.errors)[0];
  if (!primeiro) return 'Dados inválidos';
  const campo = rotulo(
    primeiro.path
      .split('.')
      .filter((p) => !/^\d+$/.test(p))
      .pop() ?? ''
  );
  if ((primeiro as mongoose.Error.ValidatorError).kind === 'required') return `${campo}: campo obrigatório`;
  return `${campo}: valor inválido`;
}

/**
 * Tratador central: traduz os erros conhecidos para status HTTP e nunca devolve stack.
 * Rotas lançam (ou rejeitam) e este é o único lugar que decide a resposta.
 */
export function tratadorDeErros(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ErroHttp) return res.status(err.status).json({ error: err.message });
  if (err instanceof ZodError) return res.status(400).json({ error: mensagemDeValidacao(err) });
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ error: err.path === '_id' ? 'Identificador inválido' : `${rotulo(err.path)}: valor inválido` });
  }
  if (err instanceof mongoose.Error.ValidationError) return res.status(400).json({ error: mensagemDoMongoose(err) });
  if ((err as { code?: number }).code === 11000) return res.status(409).json({ error: 'Já existe um registro com esse valor' });
  // Banco fora do ar ou lento demais: é indisponibilidade (503), não erro do código (500)
  if (err instanceof mongoose.mongo.MongoNetworkError || err instanceof mongoose.mongo.MongoServerSelectionError) {
    res.setHeader('Retry-After', '10');
    return res.status(503).json({ error: 'Banco de dados indisponível no momento. Tente de novo em instantes.' });
  }
  const tipo = (err as { type?: string }).type;
  if (tipo === 'entity.parse.failed') return res.status(400).json({ error: 'JSON inválido no corpo da requisição' });
  if (tipo === 'entity.too.large') return res.status(413).json({ error: 'Corpo da requisição grande demais' });

  console.error('Erro não tratado:', err);
  res.status(500).json({ error: 'Erro interno. Tente novamente em instantes.' });
}
