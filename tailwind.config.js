/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./screens/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#3b82f6', 
          dark: '#0f0f12', 
          light: '#eff6ff', 
          purple: '#b35cf6',
          card: '#1a1a1f',
          border: '#2a2a2e',
        }
      },
      fontFamily: {
        sans: ['"Inter"', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-neon': 'linear-gradient(135deg, #b35cf6 0%, #6366f1 100%)',
      }
    },
  },
  plugins: [],
}
