import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          400: '#1edfce',
          500: '#17b8c4',
          600: '#129da5',
          700: '#0e8a91',
        },
        navy: {
          950: '#050f1a',
          900: '#0a1628',
          800: '#0e1f2e',
          700: '#142a36',
          600: '#1e3a48',
          500: '#2a4d5e',
          400: '#3a6070',
        },
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.15s ease-out',
      },
    },
  },
  plugins: [],
} satisfies Config;
