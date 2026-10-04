import { slugify } from './slugify';

/** Slug livre na coleção: "titulo", "titulo-2", "titulo-3"... */
export async function slugUnico(model: { exists: (q: object) => Promise<unknown> }, base: string): Promise<string> {
  let slug = slugify(base);
  let sufixo = 1;
  while (await model.exists({ slug })) {
    slug = `${slugify(base)}-${++sufixo}`;
  }
  return slug;
}
