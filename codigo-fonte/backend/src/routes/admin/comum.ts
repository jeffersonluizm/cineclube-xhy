import { Router } from 'express';
import type { Model } from 'mongoose';
import { assincrono, ErroHttp } from '../../middleware/erros';

/** PUT /reorder: grava a posição de cada id na ordem recebida */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function rotaReordenar(router: Router, model: Model<any>) {
  router.put(
    '/reorder',
    assincrono(async (req, res) => {
      const { ids } = req.body as { ids?: string[] };
      if (!Array.isArray(ids)) throw new ErroHttp(400, 'Envie a lista de ids');
      await Promise.all(ids.map((id, i) => model.findByIdAndUpdate(id, { order: i })));
      res.json({ ok: true });
    })
  );
}

/** Próxima posição dentro do pai (texto numa revista, filme num ciclo) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function proximaOrdem(model: Model<any>, filtro: object): Promise<number> {
  const ultimo = await model.findOne(filtro).sort({ order: -1 });
  return ultimo ? ultimo.order + 1 : 0;
}
