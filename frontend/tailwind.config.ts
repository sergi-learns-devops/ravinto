import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
        heading: ['Plus Jakarta Sans', ...defaultTheme.fontFamily.sans],
        mono: ['DM Mono', ...defaultTheme.fontFamily.mono],
      },
      colors: {
        primary: {
          50: '#F0F7F4',
          100: '#DCF0E6',
          200: '#B8E1CD',
          300: '#88CCAB',
          400: '#5BB88A',
          500: '#3A9D6E',
          600: '#2D7D57',
          700: '#266347',
          800: '#224F3B',
          900: '#1E4132',
        },
        secondary: {
          50: '#FFF7F0',
          100: '#FFEDD9',
          200: '#FFD8B0',
          300: '#FFBE7D',
          400: '#FFA44A',
          500: '#F08C2D',
          600: '#D47020',
        },
        accent: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
        },
        neutral: {
          50: '#FAFAF8',
          100: '#F5F4F0',
          200: '#E8E6E1',
          300: '#D4D1CA',
          400: '#A8A49C',
          500: '#787370',
          600: '#5C5856',
          700: '#3D3B39',
          800: '#2A2827',
          900: '#1A1918',
        },
      },
      borderRadius: {
        card: '12px',
        modal: '16px',
      },
      boxShadow: {
        card: '0 4px 20px rgba(0,0,0,0.06)',
        'card-hover': '0 8px 30px rgba(0,0,0,0.08)',
        modal: '0 20px 60px rgba(0,0,0,0.12)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scale-in 0.2s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
