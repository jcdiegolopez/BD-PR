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