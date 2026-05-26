/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#1B2A4A', light: '#2A3F6A' },
        teal: { DEFAULT: '#0F6E56', light: '#E1F5EE', border: '#5DCAA5' },
        amber: { DEFAULT: '#BA7517', light: '#FAEEDA' },
        coral: '#993C1D',
        surface: '#F4F6FA',
        border: '#DDE3EE',
        tier: {
          bronze: '#CD7F32',
          silver: '#A8A8A8',
          gold: '#BA7517',
          platinum: '#534AB7',
        },
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
};
