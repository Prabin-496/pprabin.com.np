/** @type {import('tailwindcss').Config} */
export default {
    content: [
      './index.html',
      './src/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
      extend: {},
    },
    plugins: [],
    safelist: [
      'bg-white/30',
      'bg-gray-800/30',
      'border-gray-200/30',
      'border-gray-700/30',
    ],
  };