/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/ui/**/*.{ts,tsx}', './index.html'],
  theme: {
    extend: {
      colors: {
        bg: 'oklch(0.08 0.02 260)',
        surface: 'oklch(0.15 0.03 260)',
        'surface-hover': 'oklch(0.20 0.04 260)',
        accent: 'oklch(0.70 0.15 85)',
        'accent-dim': 'oklch(0.55 0.12 85)',
        ink: 'oklch(0.85 0.02 260)',
        'ink-muted': 'oklch(0.55 0.03 260)',
        border: 'oklch(0.25 0.04 260)',
      },
      fontFamily: {
        serif: ['Georgia', 'Times New Roman', 'serif'],
        mono: ['SF Mono', 'Cascadia Code', 'Consolas', 'monospace'],
        ui: ['system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
