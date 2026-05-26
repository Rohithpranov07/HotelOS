import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#1B2A4A', light: '#2A3F6A' },
        teal: { DEFAULT: '#0F6E56', light: '#E1F5EE', border: '#5DCAA5' },
        amber: { DEFAULT: '#854F0B', light: '#FAEEDA' },
        surface: '#F4F6FA',
      },
    },
  },
  plugins: [],
};
export default config;
