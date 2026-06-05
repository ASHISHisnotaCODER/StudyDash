/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        bg: {
          DEFAULT: '#12121a',
          light: '#1a1a24',
          lighter: '#1e1e2e',
        },
        accent: {
          cyan: '#00f5ff',
          violet: '#8b5cf6',
          pink: '#f472b6',
          green: '#10b981',
        },
      },
    },
  },
  plugins: [],
}
