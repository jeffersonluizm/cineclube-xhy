import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        cream: '#F2EDD6',
        'dark-purple': '#261840',
        'text-dark': '#2B2040',
        pink: '#E8368C',
        olive: '#B5BB38',
        gold: '#C8A030',
        'blue-link': '#6B72B8',
        'light-text': '#9090B8',
      },
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
