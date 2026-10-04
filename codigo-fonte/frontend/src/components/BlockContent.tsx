import type { Block } from '@/lib/types';
import { imageUrl } from '@/lib/media';
import { figureClassFor } from './ArticleBody';

interface BlockContentProps {
  blocks: Block[];
}

function ImageBlock({ block }: { block: Block }) {
  return (
    <figure className={figureClassFor(block)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl(block.src)}
        alt={block.caption || ''}
        loading="lazy"
        decoding="async"
        className="w-full h-auto rounded-sm"
      />
      {block.caption && (
        <figcaption className="font-sans text-xs text-text-suave mt-2 italic">{block.caption}</figcaption>
      )}
    </figure>
  );
}

/** Renderiza blocos (parágrafo, subtítulo, citação, imagem) sobre fundo claro, usado em páginas como "sobre" */
export default function BlockContent({ blocks }: BlockContentProps) {
  return (
    <div>
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'subtitle':
            return (
              <h2 key={i} className="font-display font-bold text-text-dark text-2xl mt-8 mb-3 clear-both">
                {block.text}
              </h2>
            );
          case 'quote':
            return (
              <blockquote
                key={i}
                className="font-serif italic text-gold-escuro text-lg leading-relaxed border-l-2 border-gold pl-5 my-6"
              >
                {block.text}
              </blockquote>
            );
          case 'image':
            return <ImageBlock key={i} block={block} />;
          default:
            return (
              <p key={i} className="font-serif text-text-dark text-base md:text-lg leading-relaxed mb-3">
                {block.text}
              </p>
            );
        }
      })}
      <div className="clear-both" />
    </div>
  );
}
