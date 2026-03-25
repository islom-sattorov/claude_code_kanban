/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        dark: {
          900: '#0a0a0f',
          800: '#111118',
          700: '#1a1a24',
          600: '#22222e',
          500: '#2c2c3a',
          400: '#3d3d52',
          300: '#5a5a7a',
        },
        accent: {
          purple: '#8b5cf6',
          blue: '#3b82f6',
          green: '#10b981',
          red: '#ef4444',
          yellow: '#f59e0b',
          cyan: '#06b6d4',
        },
      },
      boxShadow: {
        card: '0 1px 3px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.3)',
        'card-hover':
          '0 8px 24px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.4)',
        'glow-sm': '0 0 6px rgba(139, 92, 246, 0.15)',
        'glow-md':
          '0 0 12px rgba(139, 92, 246, 0.25), 0 0 4px rgba(139, 92, 246, 0.1)',
        'glow-lg':
          '0 0 24px rgba(139, 92, 246, 0.35), 0 0 48px rgba(139, 92, 246, 0.15)',
        'glow-purple':
          '0 0 16px rgba(139, 92, 246, 0.4), 0 0 32px rgba(139, 92, 246, 0.2)',
        'glow-blue':
          '0 0 16px rgba(59, 130, 246, 0.4), 0 0 32px rgba(59, 130, 246, 0.2)',
        'glow-green':
          '0 0 16px rgba(16, 185, 129, 0.4), 0 0 32px rgba(16, 185, 129, 0.2)',
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        card: '14px',
        pill: '999px',
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        glow: 'glow 2s ease-in-out infinite alternate',
        'slide-in-right': 'slide-in-right 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'fade-in': 'fade-in 0.25s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        shimmer: 'shimmer 2s linear infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(139, 92, 246, 0.3)' },
          '100%': {
            boxShadow:
              '0 0 20px rgba(139, 92, 246, 0.6), 0 0 40px rgba(139, 92, 246, 0.2)',
          },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { transform: 'translateY(-4px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
};
