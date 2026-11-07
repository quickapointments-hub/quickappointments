/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F1F9EC',
          100: '#DEF1D4',
          200: '#BEE4A9',
          300: '#9DD47B',
          400: '#80C551',
          500: '#65B32E', // Brand Core Green from logo
          600: '#529624',
          700: '#417A1C',
          800: '#305C14',
          900: '#21400D',
        },
        charcoal: {
          50: '#F8F9FA',
          100: '#F1F2F4',
          200: '#E2E4E8',
          300: '#C7CAD1',
          400: '#8E93A0',
          500: '#5F6473',
          600: '#3E424F',
          700: '#282B33',
          800: '#1A1C22',
          900: '#111114', // Brand Jet Black from logo
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

