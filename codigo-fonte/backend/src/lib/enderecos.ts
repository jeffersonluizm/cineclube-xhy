import type { Types } from 'mongoose';
import Magazine from '../models/Magazine';
import Catalog from '../models/Catalog';
import Cycle from '../models/Cycle';

/**
 * Endereço público (rota do site) de textos e filmes. Carrega os pais com uma consulta
 * por tipo ($in), nunca uma por item.
 */

type Pai = 'revista' | 'catalogo' | 'ciclo';
interface TextoComPai {
  slug: string;
  parentType: Pai;
  parentId: Types.ObjectId | string;
}
interface FilmeComCiclo {
  slug: string;
  cycleId: Types.ObjectId | string;
}

async function mapaDePais(revistas: unknown[], catalogos: unknown[], ciclos: unknown[]) {
  const [revs, cats, cics] = await Promise.all([
    revistas.length
      ? Magazine.find({ _id: { $in: revistas } })
          .select('number')
          .lean()
      : [],
    catalogos.length
      ? Catalog.find({ _id: { $in: catalogos } })
          .select('slug')
          .lean()
      : [],
    ciclos.length
      ? Cycle.find({ _id: { $in: ciclos } })
          .select('slug')
          .lean()
      : [],
  ]);
  return {
    revista: new Map(revs.map((r) => [String(r._id), String(r.number)])),
    catalogo: new Map(cats.map((c) => [String(c._id), c.slug])),
    ciclo: new Map(cics.map((c) => [String(c._id), c.slug])),
  };
}

export function hrefDoTexto(tipo: Pai, chavePai: string, slug: string): string {
  if (tipo === 'revista') return `/revista/${chavePai}/artigo/${slug}`;
  if (tipo === 'catalogo') return `/catalogos/${chavePai}/${slug}`;
  return `/ciclos-mostras/${chavePai}/texto/${slug}`;
}

/** Acrescenta `href` (e `onde`, a chave do pai) a cada texto; textos órfãos ficam de fora */
export async function comEnderecos<T extends TextoComPai>(textos: T[]): Promise<(T & { href: string })[]> {
  const ids = (tipo: Pai) => textos.filter((t) => t.parentType === tipo).map((t) => t.parentId);
  const pais = await mapaDePais(ids('revista'), ids('catalogo'), ids('ciclo'));
  return textos.flatMap((t) => {
    const chave = pais[t.parentType].get(String(t.parentId));
    return chave ? [{ ...t, href: hrefDoTexto(t.parentType, chave, t.slug) }] : [];
  });
}

export async function filmesComEnderecos<T extends FilmeComCiclo>(filmes: T[]): Promise<(T & { href: string })[]> {
  const { ciclo } = await mapaDePais(
    [],
    [],
    filmes.map((f) => f.cycleId)
  );
  return filmes.flatMap((f) => {
    const slugCiclo = ciclo.get(String(f.cycleId));
    return slugCiclo ? [{ ...f, href: `/ciclos-mostras/${slugCiclo}/${f.slug}` }] : [];
  });
}
