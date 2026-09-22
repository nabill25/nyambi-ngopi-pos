/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        background: '#f8faf8',
        surface: {
          DEFAULT: '#ffffff',
          2: '#f0f6f1',
        },
        sidebar: '#0d3d20',
        // Nyambi Ngopi brand green — replaces Tailwind's stock teal "emerald"
        // scale so every existing emerald-* utility across the app renders
        // in the logo's forest-green hue without touching each call site.
        emerald: {
          50:  '#eefaf1',
          100: '#d3f2dc',
          200: '#a6e3bb',
          300: '#75cf98',
          400: '#45b975',
          500: '#1f9c56',
          600: '#167f45',
          700: '#136838',
          800: '#0f522d',
          900: '#0d3d20',
          950: '#062514',
        },
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'emerald': '0 4px 32px rgba(15, 82, 45, 0.25)',
        'emerald-sm': '0 2px 16px rgba(15, 82, 45, 0.18)',
      },
      animation: {
        'fadeIn':   'fadeIn 0.25s ease-out both',
        'slideUp':  'slideUp 0.3s ease-out both',
        'scaleIn':  'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) both',
        'overlayIn': 'overlayIn 0.2s ease-out both',
        'pageIn':   'pageIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(24px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { from: { opacity: '0', transform: 'scale(0.94)' }, to: { opacity: '1', transform: 'scale(1)' } },
        overlayIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        pageIn: { from: { opacity: '0', transform: 'translateY(6px) scale(0.995)' }, to: { opacity: '1', transform: 'translateY(0) scale(1)' } },
      },
    },
  },
  plugins: [],
};
