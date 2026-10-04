'use client';

import Link from 'next/link';
import { adminApi } from '@/lib/adminApi';
import type { Article } from '@/lib/types';

interface ArticleListProps {
  articles: Article[];
  onChange: (articles: Article[]) => void;
  /** Página de criação de texto (ex.: /admin/catalogos/<id>/textos/novo) */
  newHref: string;
  emptyText: string;
  description?: string;
}

/** Lista de textos de um catálogo ou ciclo no painel: reordenar, editar, excluir e criar. */
export default function ArticleList({ articles, onChange, newHref, emptyText, description }: ArticleListProps) {
  async function move(index: number, dir: -1 | 1) {
    const next = [...articles];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
    await adminApi.artigos.reorder(next.map((a) => a._id));
  }

  async function removeArticle(article: Article) {
    if (!window.confirm(`Excluir o texto "${article.title}"? Essa ação não pode ser desfeita.`)) return;
    await adminApi.artigos.remove(article._id);
    onChange(articles.filter((a) => a._id !== article._id));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display font-bold text-text-dark text-xl">textos</h2>
          {description && <p className="font-sans text-sm text-text-dark/60">{description}</p>}
        </div>
        <Link
          href={newHref}
          className="bg-pink text-white font-display font-bold px-5 py-2 rounded hover:opacity-90 transition-opacity"
        >
          + novo texto
        </Link>
      </div>

      {articles.length === 0 && <p className="font-serif text-text-dark/70">{emptyText}</p>}

      <div className="grid gap-2">
        {articles.map((article, i) => (
          <div
            key={article._id}
            className="bg-white rounded-lg px-5 py-4 flex items-center gap-4 border border-text-dark/10"
          >
            <div className="flex flex-col gap-1">
              <button
                onClick={() => move(i, -1)}
                disabled={i === 0}
                aria-label="mover para cima"
                className="text-text-dark/50 hover:text-pink disabled:opacity-20 leading-none"
              >
                ▲
              </button>
              <button
                onClick={() => move(i, 1)}
                disabled={i === articles.length - 1}
                aria-label="mover para baixo"
                className="text-text-dark/50 hover:text-pink disabled:opacity-20 leading-none"
              >
                ▼
              </button>
            </div>

            <div className="min-w-0">
              <p className="font-display font-bold text-text-dark truncate">{article.title}</p>
              <p className="font-sans text-sm text-text-dark/60">
                {article.column} · por {article.author}
                {article.published === false && <span className="text-gold"> · rascunho</span>}
              </p>
            </div>

            <div className="ml-auto flex items-center gap-4 shrink-0">
              <Link href={`/admin/artigos/${article._id}`} className="font-display text-blue-link hover:underline">
                editar
              </Link>
              <button onClick={() => removeArticle(article)} className="font-display text-pink hover:underline">
                excluir
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
