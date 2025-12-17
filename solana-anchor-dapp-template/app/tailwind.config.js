/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'solana-purple': '#9945FF',
        'solana-green': '#14F195',
        'solana-blue': '#00C2FF',
      },
      backgroundImage: {
        'gradient-solana': 'linear-gradient(to right, #9945FF, #14F195)',
      },
    },
  },
  plugins: [],
};
