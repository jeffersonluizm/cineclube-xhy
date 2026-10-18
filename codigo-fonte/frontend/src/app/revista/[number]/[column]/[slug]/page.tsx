import { permanentRedirect } from 'next/navigation';

interface Props {
  params: Promise<{ number: string; column: string; slug: string }>;
}

/**
 * Rota antiga (/revista/2/coluna/slug). Mantida apenas para links já compartilhados:
 * redireciona de forma permanente para o endereço canônico do texto.
 */
export default async function LegacyArticlePage(props: Props) {
  const params = await props.params;
  permanentRedirect(`/revista/${params.number}/artigo/${params.slug}`);
}
