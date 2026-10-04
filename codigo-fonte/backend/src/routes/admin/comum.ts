import { Router } from 'express';
import type { Model } from 'mongoose';
import { assincrono, naoEncontrado } from '../../middleware/erros';
import { objectId, reordenacao } from '../../validacao/esquemas';

/** Opções de toda atualização do painel: devolve o documento novo e roda os validadores do schema */
export const ATUALIZAR = { new: true, runValidators: true } as const;

export const duplicado = (err: unknown) => (err as { code?: number }).code === 11000;

/** PUT /reorder: grava a posição de cada id na ordem recebida */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function rotaReordenar(router: Router, model: Model<any>) {
  router.put(
    '/reorder',
    assincrono(async (req, res) => {
      const { ids } = reordenacao.parse(req.body ?? {});
      // Uma ida ao banco para a lista inteira (antes: um findByIdAndUpdate por id)
      if (ids.length) {
        await model.bulkWrite(ids.map((id, i) => ({ updateOne: { filter: { _id: id }, update: { $set: { order: i } } } })), { ordered: false });
      }
      res.json({ ok: true });
    })
  );
}

/** GET /:id de um recurso do painel */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function rotaBuscarPorId(router: Router, model: Model<any>, mensagem404: string) {
  router.get(
    '/:id',
    assincrono(async (req, res) => {
      const item = await model.findById(objectId.parse(req.params.id));
      if (!item) throw naoEncontrado(mensagem404);
      res.json(item);
    })
  );
}

/** Próxima posição dentro do pai (texto numa revista, filme num ciclo) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function proximaOrdem(model: Model<any>, filtro: object): Promise<number> {
  const ultimo = await model.findOne(filtro).sort({ order: -1 }).select('order').lean<{ order: number }>();
  return ultimo ? ultimo.order + 1 : 0;
}

