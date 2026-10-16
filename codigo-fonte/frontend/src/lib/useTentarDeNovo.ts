'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { tentarDeNovo } from './tentarDeNovo';

/** Para error.tsx (dentro do roteador). O global-error fica fora dele e recarrega a página. */
export function useTentarDeNovo(reset: () => void) {
  const router = useRouter();
  const [tentando, startTransition] = useTransition();
  return {
    tentando,
    tentar: () => tentarDeNovo({ refresh: router.refresh, reset, startTransition }),
  };
}
