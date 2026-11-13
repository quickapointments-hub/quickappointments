/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FEFDF9',
          100: '#FDFCF4', // Primary App Background
          200: '#F5F2E6', // Secondary Background
          300: '#EAE5D5',
          400: '#DED6C1',
          500: '#C7BDA3',
        },
        brand: {
          50: '#F2F9ED',
          100: '#E2F4D5',
          200: '#C5E8AB',
          300: '#A4DC7B',
          400: '#84CD52',
          500: '#65B32E', // Official Brand Logo Green
          600: '#529624',
          700: '#417A1C',
          800: '#305C14',
          900: '#21400D',
        },
        charcoal: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563', // Secondary Dark Grey text
          700: '#374151',
          800: '#1F2937',
          900: '#111111', // Primary Black text
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
