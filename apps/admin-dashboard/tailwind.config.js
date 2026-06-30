/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "hsl(38 92% 50%)", // Karnataka theme saffron
          foreground: "hsl(0 0% 100%)"
        },
        secondary: {
          DEFAULT: "hsl(222 47% 11%)",
          foreground: "hsl(210 40% 98%)"
        },
        accent: {
          DEFAULT: "hsl(142 70% 29%)",
          foreground: "hsl(0 0% 100%)"
        }
      }
    },
  },
  plugins: [],
}
