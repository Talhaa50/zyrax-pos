/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        /* ── Brand (dynamic via CSS vars) ── */
        brand: {
          50:  'rgb(var(--brand-50)  / <alpha-value>)',
          100: 'rgb(var(--brand-100) / <alpha-value>)',
          200: 'rgb(var(--brand-200) / <alpha-value>)',
          300: 'rgb(var(--brand-300) / <alpha-value>)',
          400: 'rgb(var(--brand-400) / <alpha-value>)',
          500: 'rgb(var(--brand-500) / <alpha-value>)',
          600: 'rgb(var(--brand-600) / <alpha-value>)',
          700: 'rgb(var(--brand-700) / <alpha-value>)',
          800: 'rgb(var(--brand-800) / <alpha-value>)',
          900: 'rgb(var(--brand-900) / <alpha-value>)',
          950: 'rgb(var(--brand-950) / <alpha-value>)',
        },

        /* ── Light surfaces ── */
        surface: {
          DEFAULT:   '#ffffff',
          secondary: '#f5f5f7',
          tertiary:  '#ebebf0',
        },

        /* ── Dark surfaces (warm black) ── */
        'surface-dark': {
          DEFAULT:   '#1a1917',   /* cards */
          secondary: '#242220',   /* elevated / modals */
          tertiary:  '#2e2c2a',   /* deepest */
          base:      '#0f0f0d',   /* page background */
        },

        /* ── Warm text tokens for dark mode ── */
        warm: {
          50:  '#faf9f7',
          100: '#f0ede8',   /* primary text in dark */
          200: '#e5e0d8',
          300: '#d4cfc8',   /* secondary text dark */
          400: '#a8a29e',
          500: '#78716c',   /* muted text dark */
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
        },
      },

      fontFamily: {
        sans:    ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Montserrat', 'system-ui', 'sans-serif'],
        brand:   ['Caveat', 'cursive'],
      },

      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },

      boxShadow: {
        ios:       '0 1px 3px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.06)',
        'ios-md':  '0 2px 8px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.08)',
        'ios-lg':  '0 4px 16px rgba(0,0,0,0.06), 0 16px 48px rgba(0,0,0,0.1)',
        'ios-inset': 'inset 0 1px 2px rgba(0,0,0,0.06)',
        glow:      '0 0 0 3px rgba(59,130,246,0.15)',
        'glow-warm': '0 0 0 3px rgba(245,158,11,0.15)',
      },

      backdropBlur: {
        ios: '20px',
      },

      transitionTimingFunction: {
        ios:        'cubic-bezier(0.25, 0.1, 0.25, 1)',
        'ios-spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },

      keyframes: {
        'slide-in': {
          from: { transform: 'translateX(100%)', opacity: '0' },
          to:   { transform: 'translateX(0)',    opacity: '1' },
        },
        'slide-down': {
          from: { transform: 'translateY(-8px)', opacity: '0' },
          to:   { transform: 'translateY(0)',    opacity: '1' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px) scale(0.96)' },
          to:   { opacity: '1', transform: 'translateY(0)   scale(1)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.92)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },

      animation: {
        'slide-in':   'slide-in   0.35s cubic-bezier(0.25, 0.1, 0.25, 1)',
        'slide-down': 'slide-down 0.25s cubic-bezier(0.25, 0.1, 0.25, 1)',
        'fade-up':    'fade-up    0.3s  cubic-bezier(0.25, 0.1, 0.25, 1)',
        'fade-in':    'fade-in    0.2s  ease-out',
        'scale-in':   'scale-in   0.2s  cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
};
