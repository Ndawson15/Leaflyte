import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--cv-bg)',
        surface: 'var(--cv-surface)',
        surface2: 'var(--cv-surface2)',
        border: 'var(--cv-border)',
        text: 'var(--cv-text)',
        muted: 'var(--cv-muted)',
        amber: 'var(--cv-amber)',
        teal: 'var(--cv-teal)'
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};

export default config;
