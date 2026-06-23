/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  darkMode: 'class', // or 'media'
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#4A90E2', // A nice blue
          DEFAULT: '#357ABD',
          dark: '#2A6496',
        },
        secondary: {
          light: '#50E3C2', // A teal/mint
          DEFAULT: '#38B2AC',
          dark: '#2C7A7B',
        },
        background: {
          light: '#f3f4f6',
          dark: '#080c14',
        },
        card: {
          light: 'rgba(255, 255, 255, 0.45)',
          dark: 'rgba(13, 20, 35, 0.65)',
        },
        text: {
          light: '#2D3748',
          dark: '#E2E8F0',
        },
        'text-muted': {
          light: '#718096',
          dark: '#A0AEC0',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Example: Using Inter font
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'), // For styling HTML from rich text editor
  ],
}