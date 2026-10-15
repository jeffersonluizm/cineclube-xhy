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

export const DATA_CARGA = 'outubro de 2026 (50 usuários simultâneos, k6, uma carga por vez na máquina)';

export const RESUMO_CARGA: LinhaCarga[] = [
  {
    cenario: 'Página inicial na API, 30 edições',
    antes: '34 consultas · 56 req/s',
    depois: '4 consultas · 255 req/s',
    conclusao: 'Consultas fixas (fim do N+1)',
  },
  { cenario: 'Sumário de uma edição', antes: '384 kB · 146 req/s', depois: '7 kB · 385 req/s', conclusao: 'Só os campos usados' },
  {
    cenario: 'Texto com anterior/próximo',
    antes: '172 req/s · p95 317 ms',
    depois: '726 req/s · p95 75 ms',
    conclusao: 'Vizinhos enxutos e índice',
  },
  { cenario: 'Reordenar 50 textos', antes: '49 req/s · p95 1,1 s', depois: '451 req/s · p95 308 ms', conclusao: 'Uma ida ao banco' },
  {
    cenario: 'Criar textos com o mesmo título (10 juntos)',
    antes: '66% com erro 500',
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
    cenario: 'Vazão do site com cache',
    antes: '52 a 135 req/s',
    depois: '122 a 412 req/s',
    conclusao: 'Hipótese de 10× refutada: só 1,1× a 3,3×. O limite passou a ser renderizar o HTML num processo só',
  },
  {
    cenario: 'Site com a API fora do ar',
    antes: '404 falso e listas vazias',
    depois: 'Conteúdo do cache',
    conclusao: 'Sem informação falsa',
  },
];
