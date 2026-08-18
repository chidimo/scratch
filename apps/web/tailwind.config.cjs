const path = require('node:path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    path.join(__dirname, 'index.html'),
    path.join(__dirname, 'src/**/*.{js,ts,jsx,tsx}'),
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EAF1F4',
          100: '#CFDEE5',
          200: '#A6C1CC',
          300: '#7CA3B2',
          400: '#537F93',
          500: '#30566C',
          600: '#284A5D',
          700: '#213D4C',
          800: '#1D3340',
          900: '#152530',
        },
        accent: {
          blue: '#41A2DA',
          green: '#A6D27C',
          pink: '#F59A9D',
          yellow: '#F6DE88',
        },
      },
    },
  },
  plugins: [],
};
