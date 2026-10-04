import type { Block } from '@/lib/types';
import { imageUrl } from '@/lib/media';
import Notas from './Notas';

interface ArticleBodyProps {
  content: string;
  blocks?: Block[];
  epigraph?: string;
  footnotes?: string[];
}

const widthClasses: Record<NonNullable<Block['width']>, string> = {
  small: 'max-w-[260px]',
  medium: 'max-w-[440px]',
  large: 'max-w-full',
};

/** Imagem dentro do texto. No celular nunca flutua: fica centralizada, com o texto abaixo. */
export function figureClassFor(block: Block) {
  const width = widthClasses[block.width ?? 'large'];
  const align = block.align ?? 'full';

  switch (align) {
    case 'left':
      return `w-full mx-auto mb-4 md:mx-0 md:float-left md:mr-6 ${width}`;
    case 'right':
      return `w-full mx-auto mb-4 md:mx-0 md:float-right md:ml-6 ${width}`;
    case 'center':
      return `w-full mx-auto my-8 ${width}`;
    default:
      return 'my-8 w-full';
  }
}

function ImageBlock({ block }: { block: Block }) {
  return (
    <figure className={figureClassFor(block)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageUrl(block.src)} alt={block.caption || ''} loading="lazy" decoding="async" className="w-full h-auto rounded-sm" />
      {block.caption && <figcaption className="font-sans text-xs text-light-text mt-2 italic">{block.caption}</figcaption>}
    </figure>
  );
}

function BlockRenderer({ block }: { block: Block }) {
  switch (block.type) {
    case 'subtitle':
      return <h2 className="font-display font-bold text-cream text-2xl mt-10 mb-4 clear-both">{block.text}</h2>;
    case 'quote':
      return (
        <blockquote className="font-serif italic text-gold text-lg leading-relaxed border-l-2 border-gold pl-5 my-8">{block.text}</blockquote>
      );
    case 'image':
      return <ImageBlock block={block} />;
    default:
      return <p className="font-serif text-cream text-base md:text-lg leading-relaxed mb-4">{block.text}</p>;
  }
}

/** Corpo de leitura (fundo roxo): epígrafe, blocos e notas laterais */
export default function ArticleBody({ content, blocks, epigraph, footnotes }: ArticleBodyProps) {
  const hasBlocks = Array.isArray(blocks) && blocks.length > 0;
  const paragraphs = hasBlocks ? [] : (content ?? '').split('\n').filter((p) => p.trim());

  return (
    <div className="relative max-w-4xl">
      {epigraph && (
        <div className="mb-10 md:ml-[40%] md:mr-8">
          <p className="font-serif italic text-gold md:text-right text-base leading-relaxed">{epigraph}</p>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1 min-w-0 max-w-prose">
          {hasBlocks
            ? blocks!.map((block, i) => <BlockRenderer key={i} block={block} />)
            : paragraphs.map((para, i) => (
                <p key={i} className="font-serif text-cream text-base md:text-lg leading-relaxed mb-4">
                  {para}
                </p>
              ))}
          <div className="clear-both" />
        </div>

        {footnotes && footnotes.length > 0 && <Notas notas={footnotes} />}
      </div>
    </div>
  );
}
