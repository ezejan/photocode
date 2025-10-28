import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1f2937',
          foreground: '#f9fafb',
        },
        accent: '#0ea5e9',
      },
    },
  },
  plugins: [],
};

export default config;
