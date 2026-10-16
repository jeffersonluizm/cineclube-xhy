import type { Config } from 'tailwindcss';
import { cores, escalaTitulos } from './src/lib/tokens';

// Cores e escala de títulos vêm de src/lib/tokens.ts (fonte única, com teste de contraste)
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: { ...cores },
      fontSize: Object.fromEntries(
        Object.entries(escalaTitulos).map(([nome, [tamanho, linha]]) => [nome, [tamanho, { lineHeight: linha }]])
      ),
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
