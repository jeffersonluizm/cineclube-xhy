import { imageUrl } from '@/lib/media';

interface CapaProps {
  src?: string;
  alt: string;
  /** classe de largura máxima (ex.: max-w-[430px]) */
  largura?: string;
  prioridade?: boolean;
}

/** Capa 3:4 de revista ou catálogo; sem imagem, um bloco roxo do mesmo tamanho (sem layout pulando) */
export default function Capa({ src, alt, largura = 'max-w-[430px]', prioridade = false }: CapaProps) {
  return (
    <div className={`w-full shrink-0 self-start ${largura}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl(src)}
          alt={alt}
          decoding="async"
          loading={prioridade ? 'eager' : 'lazy'}
          className="w-full object-cover aspect-[3/4]"
        />
      ) : (
        <div className="w-full bg-dark-purple aspect-[3/4]" role="img" aria-label={`${alt} (sem imagem)`} />
      )}
    </div>
  );
}
