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
          primary: '#F5F0E8',
          secondary: '#F3E1E4',
          accent: '#D62B42',
          'accent-light': '#ED3951',
          'accent-dark': '#B8283B',
        },
        text: {
          primary: '#1A1A1A',
          secondary: '#6B6B6B',
          contrast: '#F5F0E8',
        },
        accent: {
          DEFAULT: '#D62B42',
          light: '#ED3951',
          dark: '#B8283B',
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