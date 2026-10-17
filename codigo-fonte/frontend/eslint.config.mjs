// ESLint direto (o Next 16 tirou o `next lint`), em config flat. Mesmas regras do antigo
// .eslintrc.json (next/core-web-vitals do Next 14), com <img> liberado: o otimizador de
// imagens está desligado.
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';

// O eslint-plugin-react-hooks 7 (eslint-config-next 16) liga as regras do React Compiler. O site
// não usa o compilador e o lint antigo só tinha rules-of-hooks e exhaustive-deps: ficam desligadas
// para a troca de versão não mudar as regras. Adotá-las é uma decisão à parte.
const regrasDoReactCompiler = [
  'config',
  'error-boundaries',
  'gating',
  'globals',
  'immutability',
  'incompatible-library',
  'preserve-manual-memoization',
  'purity',
  'refs',
  'set-state-in-effect',
  'set-state-in-render',
  'static-components',
  'unsupported-syntax',
  'use-memo',
];

export default defineConfig([
  ...nextVitals,
  {
    // como o `next lint`: comentários eslint-disable que sobraram não viram aviso
    linterOptions: { reportUnusedDisableDirectives: 'off' },
    rules: {
      '@next/next/no-img-element': 'off',
      ...Object.fromEntries(regrasDoReactCompiler.map((regra) => [`react-hooks/${regra}`, 'off'])),
    },
  },
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
]);
