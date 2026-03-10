/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,jsx}',
    './src/components/**/*.{js,jsx}',
    './src/pages/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: {
          primary: '#FBF4EE',
          secondary: '#F2E1D3',
          accent: '#D62B42',
          'accent-light': '#E45163',
          'accent-dark': '#A62033',
        },
        text: {
          primary: '#201817',
          secondary: '#6B5752',
          contrast: '#FFF7F2',
        },
        accent: {
          DEFAULT: '#D62B42',
          light: '#E45163',
          dark: '#A62033',
        },
        status: {
          pending:     { bg: '#FEF3C7', text: '#92400E' },
          progress:    { bg: '#DBEAFE', text: '#1E40AF' },
          success:     { bg: '#D1FAE5', text: '#065F46' },
          'success-alt': { bg: '#A7F3D0', text: '#064E3B' },
          transit:     { bg: '#EDE9FE', text: '#5B21B6' },
        },
        role: {
          owner:       { bg: '#EDE9FE', text: '#5B21B6' },
          worker:      { bg: '#DBEAFE', text: '#1E40AF' },
          repartidor:  { bg: '#FEF3C7', text: '#92400E' },
          customer:    { bg: '#D1FAE5', text: '#065F46' },
        },
        star: '#F59E0B',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
      },
    },
    container: {
      center: true,
      padding: '2rem',
    },
  },
  plugins: [],
};