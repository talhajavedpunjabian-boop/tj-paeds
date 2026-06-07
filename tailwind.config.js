/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['DM Mono', 'Consolas', 'monospace'],
      },
      colors: {
        blue: { DEFAULT: '#3b82f6', deep: '#1d4ed8', light: '#eff6ff', mid: '#dbeafe' },
        slate: { DEFAULT: '#1e293b', mid: '#475569', light: '#94a3b8' },
        border: '#e2e8f0',
        surface: '#ffffff',
        bg: '#f8fafc',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        spin: { to: { transform: 'rotate(360deg)' } },
      },
      animation: {
        'fade-up': 'fadeUp 0.25s ease both',
        'fade-in': 'fadeIn 0.2s ease both',
        'shimmer': 'shimmer 1.4s infinite',
        'spin-slow': 'spin 0.8s linear infinite',
      },
    },
  },
  plugins: [],
};
