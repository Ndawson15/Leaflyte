import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './mdx-components.tsx'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--docs-bg)',
        surface: 'var(--docs-surface)',
        border: 'var(--docs-border)',
        text: 'var(--docs-text)',
        muted: 'var(--docs-muted)',
        accent: 'var(--docs-accent)',
        'accent-soft': 'var(--docs-accent-soft)',
        forest: 'var(--docs-forest)',
      },
      fontFamily: {
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      maxWidth: {
        content: '720px',
        layout: '1440px',
      },
      boxShadow: {
        nav: '0 1px 0 var(--docs-border), 0 8px 32px rgba(36, 53, 40, 0.06)',
      },
    },
  },
  plugins: [],
};

export default config;
