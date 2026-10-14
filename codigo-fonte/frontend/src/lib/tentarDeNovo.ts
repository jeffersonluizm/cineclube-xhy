/**
 * "Tentar novamente" das telas de erro. Só o reset() redesenha a mesma árvore com os mesmos
 * dados do servidor (que falharam): a página continua quebrada mesmo com a API de volta.
 * router.refresh() busca de novo no servidor; os dois juntos numa transição trocam a tela de
 * erro pela página nova sem piscar.
 */
export function tentarDeNovo({
  refresh,
  reset,
  startTransition,
}: {
  refresh: () => void;
  reset: () => void;
  startTransition: (fn: () => void) => void;
}) {
  startTransition(() => {
    refresh();
    reset();
  });
}
