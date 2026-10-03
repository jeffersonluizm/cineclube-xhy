import { permanentRedirect } from 'next/navigation';

interface Props {
  params: { number: string; column: string; slug: string };
}

/**
 * Rota antiga (/revista/2/coluna/slug). Mantida apenas para links já compartilhados:
 * redireciona de forma permanente para o endereço canônico do texto.
 */
export default function LegacyArticlePage({ params }: Props) {
  permanentRedirect(`/revista/${params.number}/artigo/${params.slug}`);
}
