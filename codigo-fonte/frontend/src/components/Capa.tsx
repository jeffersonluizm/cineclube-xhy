import { imageUrl } from '@/lib/media';
import CapaPadrao from './CapaPadrao';

interface CapaProps {
  src?: string;
  alt: string;
  /** título mostrado na capa padrão quando não há imagem */
  titulo: string;
  /** classe de largura máxima (ex.: max-w-[430px]) */
  largura?: string;
  prioridade?: boolean;
}

/** Capa 3:4 de revista ou catálogo; sem imagem, a capa padrão (título e logo sobre o roxo) */
export default function Capa({ src, alt, titulo, largura = 'max-w-[430px]', prioridade = false }: CapaProps) {
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
        <CapaPadrao titulo={titulo} />
      )}
    </div>
  );
}
