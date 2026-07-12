/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Paleta "libro contable" — teal profundo + acentos cálidos
        bg: {
          light: '#F4F6F5',
          dark: '#0E1512',
        },
        surface: {
          light: '#FFFFFF',
          dark: '#161F1B',
        },
        border: {
          light: '#E1E5E2',
          dark: '#22302A',
        },
        ink: {
          light: '#1B2421',
          dark: '#E7ECE9',
        },
        muted: {
          light: '#66756F',
          dark: '#8CA098',
        },
        primary: {
          DEFAULT: '#0F6B5C',
          light: '#14876F',
          dark: '#0B4F44',
        },
        accent: {
          DEFAULT: '#D4A24C',
          light: '#E5B968',
        },
        danger: {
          DEFAULT: '#B54A3F',
          light: '#CB6255',
        },
        success: {
          DEFAULT: '#3F9B7A',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-fraunces)', 'serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
      },
    },
  },
  plugins: [],
};
