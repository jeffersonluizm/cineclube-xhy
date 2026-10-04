import type { Model } from 'mongoose';
import { slugify } from './slugify';

/**
 * Próximo slug livre: "titulo", "titulo-2", "titulo-3"... numa única consulta (antes era
 * uma por sufixo já usado). Corrida entre criações simultâneas fica com criarComSlugUnico.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function slugUnico(model: Model<any>, base: string): Promise<string> {
  const raiz = slugify(base) || 'sem-titulo';
  // slugify só produz [a-z0-9-]: nada a escapar na expressão regular
  const usados = await model
    .find({ slug: new RegExp(`^${raiz}(-[0-9]+)?$`) })
    .select('slug')
    .lean<{ slug: string }[]>();
  if (!usados.some((u) => u.slug === raiz)) return raiz;
  const maior = Math.max(1, ...usados.map((u) => Number(u.slug.slice(raiz.length + 1)) || 1));
  return `${raiz}-${maior + 1}`;
}

/**
 * Cria o documento com slug único. Se outra criação simultânea pegar o mesmo slug entre a
 * consulta e a gravação, o índice único recusa (E11000) e tentamos de novo com o próximo.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function criarComSlugUnico<T>(model: Model<any>, titulo: string, dados: object, tentativas = 12): Promise<T> {
  for (let i = 0; ; i++) {
    const slug = await slugUnico(model, titulo);
    try {
      return (await model.create({ ...dados, slug })) as T;
    } catch (err) {
      const colisaoDeSlug = (err as { code?: number; keyPattern?: Record<string, unknown> }).code === 11000 &&
        'slug' in ((err as { keyPattern?: Record<string, unknown> }).keyPattern ?? {});
      if (!colisaoDeSlug || i >= tentativas - 1) throw err;
      // Espera aleatória curta: as criações concorrentes deixam de calcular o mesmo sufixo juntas
      await new Promise((r) => setTimeout(r, Math.random() * 15 * (i + 1)));
    }
  }
}
