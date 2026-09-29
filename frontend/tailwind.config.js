/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#ffffff',
        ink: '#171717',
        muted: '#f5f5f5',
      },
    },
  },
  plugins: [],
};
