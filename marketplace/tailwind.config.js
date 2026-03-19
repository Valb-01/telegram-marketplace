/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0f0f0f',
          secondary: '#121212',
          tertiary: '#171717',
          card: '#1c1c1c',
          hover: '#2a2a2a',
        },
        brand: {
          blue: '#3b82f6',
          purple: '#8b5cf6',
          pink: '#ec4899',
        },
        accent: '#3b82f6',
      },
      fontFamily: {
        sans: ['Inter var', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899)',
        'gradient-card': 'linear-gradient(180deg, #1c1c1c 0%, #121212 100%)',
      },
      animation: {
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
