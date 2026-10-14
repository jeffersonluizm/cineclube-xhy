/**
 * Resumo do teste de carga mostrado em /como-foi-feito. Os números completos, o método e
 * os gráficos estão em docs/carga/2026-10-04-resultados.md na raiz do repositório.
 */
export interface LinhaCarga {
  cenario: string;
  antes: string;
  depois: string;
  conclusao: string;
}

export const DATA_CARGA = 'outubro de 2026 (50 usuários simultâneos, k6)';

export const RESUMO_CARGA: LinhaCarga[] = [
  {
    cenario: 'Página inicial na API, 30 edições',
    antes: '34 consultas · 43 req/s',
    depois: '4 consultas · 87 req/s',
    conclusao: 'Consultas fixas (fim do N+1)',
  },
  { cenario: 'Sumário de uma edição', antes: '384 kB · 105 req/s', depois: '7 kB · 257 req/s', conclusao: 'Só os campos usados' },
  {
    cenario: 'Texto com anterior/próximo',
    antes: '118 req/s · p95 477 ms',
    depois: '692 req/s · p95 82 ms',
    conclusao: 'Vizinhos enxutos e índice',
  },
  { cenario: 'Reordenar 50 textos', antes: '33 req/s · p95 3 s', depois: '474 req/s · p95 146 ms', conclusao: 'Uma ida ao banco' },
  {
    cenario: 'Criar textos com o mesmo título (10 juntos)',
    antes: '61% com erro 500',
    depois: '0 erros',
    conclusao: 'Corrida do slug corrigida',
  },
  {
    cenario: 'Página do site (consultas por visita)',
    antes: '65 na home',
    depois: '0 (cache)',
    conclusao: 'Banco fora do caminho do leitor',
  },
  {
    cenario: 'Site com a API fora do ar',
    antes: '404 falso e listas vazias',
    depois: 'Conteúdo do cache',
    conclusao: 'Sem informação falsa',
  },
];
