import type { Metadata } from 'next';
import ListaPorAno from '@/components/ListaPorAno';
import { api } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Revista',
  description: 'Todas as edições da Revista XHY, por ano.',
  alternates: { canonical: '/revista' },
};

export default async function RevistaPage() {
  // Sem try/catch: se a API falhar, o error.tsx mostra "serviço indisponível" (não uma lista vazia falsa)
  const revistas = await api.revista.list();
  return (
    <ListaPorAno
      titulo="Revista XHY: edições"
      migalha="revista xhy"
      itens={revistas}
      href={(m) => `/revista/${m.number}`}
      rotulo={(m) => `n°${m.number}`}
      detalhe={(m) => `v.${m.volume}, ${m.month}, ${m.year}`}
      vazio="Nenhuma edição publicada ainda."
    />
  );
}
