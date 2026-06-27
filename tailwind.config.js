/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        arabic: ['Cairo', 'Tajawal', 'sans-serif'],
        sans: ['Cairo', 'Tajawal', 'sans-serif'],
      },
      colors: {
        primary: {
          50:  '#f3f0ff',
          100: '#e9e2ff',
          200: '#d4c8ff',
          300: '#b5a1ff',
          400: '#9270ff',
          500: '#7B5CC8',
          600: '#6845b8',
          700: '#5635a0',
          800: '#4B2D8F',
          900: '#3d2475',
          950: '#251452',
        },
        surface: {
          DEFAULT: '#ffffff',
          50:  '#f8f7ff',
          100: '#f0eeff',
          200: '#e8e5ff',
        },
        gray: {
          50:  '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        success: { DEFAULT: '#10b981', light: '#d1fae5', dark: '#065f46' },
        warning: { DEFAULT: '#f59e0b', light: '#fef3c7', dark: '#92400e' },
        danger:  { DEFAULT: '#ef4444', light: '#fee2e2', dark: '#991b1b' },
        info:    { DEFAULT: '#3b82f6', light: '#dbeafe', dark: '#1e40af' },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #7B5CC8 0%, #4B2D8F 100%)',
        'gradient-primary-soft': 'linear-gradient(135deg, #9270ff22 0%, #4B2D8F11 100%)',
        'gradient-surface': 'linear-gradient(180deg, #f8f7ff 0%, #ffffff 100%)',
      },
      boxShadow: {
        'glow':      '0 0 20px rgba(123, 92, 200, 0.25)',
        'glow-sm':   '0 0 10px rgba(123, 92, 200, 0.15)',
        'card':      '0 4px 24px rgba(0, 0, 0, 0.06)',
        'card-hover':'0 8px 32px rgba(123, 92, 200, 0.15)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      animation: {
        'fade-in':      'fadeIn 0.3s ease-out',
        'slide-in-rtl': 'slideInRTL 0.3s ease-out',
        'bounce-soft':  'bounceSoft 1s ease-in-out infinite',
        'pulse-glow':   'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRTL: {
          '0%':   { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-4px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(123,92,200,0.2)' },
          '50%':      { boxShadow: '0 0 25px rgba(123,92,200,0.5)' },
        },
      },
    },
  },
  plugins: [],
};
