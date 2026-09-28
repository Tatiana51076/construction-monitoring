import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
      },
      colors: {
        // Use CSS variables for theme-aware neutral colors
        surface: {
          primary: 'rgb(var(--surface-primary) / <alpha-value>)',
          secondary: 'rgb(var(--surface-secondary) / <alpha-value>)',
          tertiary: 'rgb(var(--surface-tertiary) / <alpha-value>)',
          border: 'rgb(var(--surface-border) / <alpha-value>)',
          'border-strong': 'rgb(var(--surface-border-strong) / <alpha-value>)',
        },
        content: {
          primary: 'rgb(var(--content-primary) / <alpha-value>)',
          secondary: 'rgb(var(--content-secondary) / <alpha-value>)',
          tertiary: 'rgb(var(--content-tertiary) / <alpha-value>)',
          muted: 'rgb(var(--content-muted) / <alpha-value>)',
        },
        // Keep ink ramp for backwards compat (dark theme values)
        ink: {
          900: '#0b1120',
          800: '#111827',
          700: '#1e293b',
          600: '#334155',
          500: '#475569',
          400: '#64748b',
          300: '#94a3b8',
          200: '#cbd5e1',
          100: '#e2e8f0',
          50: '#f1f5f9',
        },
        success: {
          50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7',
          400: '#34d399', 500: '#10b981', 600: '#059669', 700: '#047857',
        },
        warning: {
          50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d',
          400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309',
        },
        danger: {
          50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5',
          400: '#f87171', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c',
        },
        accent: {
          400: '#38bdf8', 500: '#0ea5e9', 600: '#0284c7', 700: '#0369a1',
        },
      },
      keyframes: {
        'pulse-ring': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(239,68,68,0.45)' },
          '50%': { boxShadow: '0 0 0 8px rgba(239,68,68,0)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.4', transform: 'scale(1.4)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'grow-bar': {
          '0%': { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
      animation: {
        'pulse-ring': 'pulse-ring 2s ease-in-out infinite',
        'pulse-dot': 'pulse-dot 1.4s ease-in-out infinite',
        'slide-up': 'slide-up 0.5s ease-out both',
        'shimmer': 'shimmer 2.5s linear infinite',
        'grow-bar': 'grow-bar 0.9s cubic-bezier(0.22,1,0.36,1) both',
        'float': 'float 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
