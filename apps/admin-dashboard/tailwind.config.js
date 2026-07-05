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
          DEFAULT: "hsl(38, 92%, 50%)",
          foreground: "hsl(0, 0%, 100%)",
          50: "hsl(38, 92%, 95%)",
          100: "hsl(38, 92%, 85%)",
          200: "hsl(38, 92%, 75%)",
          300: "hsl(38, 92%, 65%)",
          400: "hsl(38, 92%, 55%)",
          500: "hsl(38, 92%, 50%)",
          600: "hsl(38, 92%, 40%)",
          700: "hsl(38, 92%, 30%)",
          800: "hsl(38, 92%, 20%)",
          900: "hsl(38, 92%, 10%)",
        },
        secondary: {
          DEFAULT: "hsl(222, 47%, 11%)",
          foreground: "hsl(210, 40%, 98%)",
        },
        accent: {
          DEFAULT: "hsl(142, 70%, 29%)",
          foreground: "hsl(0, 0%, 100%)",
        },
        surface: {
          DEFAULT: "hsl(0, 0%, 98%)",
          100: "hsl(0, 0%, 96%)",
          200: "hsl(0, 0%, 92%)",
        }
      },
      borderRadius: {
        DEFAULT: "12px",
        lg: "16px",
        xl: "24px",
      },
      fontFamily: {
        sans: ["Inter", "Karla", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        tight: "-0.02em",
        tighter: "-0.04em",
      },
      animation: {
        "spin-slow": "spin 3s linear infinite",
        "ping-slow": "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite",
        "pulse-soft": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      }
    },
  },
  plugins: [],
}
