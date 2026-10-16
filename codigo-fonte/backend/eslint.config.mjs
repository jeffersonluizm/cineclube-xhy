// Lint do backend: regras recomendadas de JS e TypeScript
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'data/**', 'uploads/**', 'demo-imagens/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // scripts soltos em Node (ex.: ferramentas/gerar-capas.mjs)
    files: ['**/*.mjs'],
    languageOptions: { globals: { Buffer: 'readonly', URL: 'readonly', console: 'readonly', process: 'readonly' } },
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' }],
    },
  }
);
