/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "../../packages/ui/src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Brand colors - Namma Yatri Design System
        primary: "#692727",
        "on-primary": "#ffffff",
        "primary-container": "#863d3c",
        "on-primary-container": "#ffb5b2",
        "primary-fixed": "#ffdad8",
        "primary-fixed-dim": "#ffb3b0",
        "on-primary-fixed": "#3d0609",
        "on-primary-fixed-variant": "#763130",

        secondary: "#835500",
        "on-secondary": "#ffffff",
        "secondary-container": "#feae2c",
        "on-secondary-container": "#6b4500",
        "secondary-fixed": "#ffddb4",
        "secondary-fixed-dim": "#ffb955",
        "on-secondary-fixed": "#291800",
        "on-secondary-fixed-variant": "#633f00",

        tertiary: "#3b3d3d",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#525454",
        "on-tertiary-container": "#c7c8c8",
        "tertiary-fixed": "#e2e2e2",
        "tertiary-fixed-dim": "#c6c6c7",
        "on-tertiary-fixed": "#1a1c1c",
        "on-tertiary-fixed-variant": "#454747",

        error: "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",

        background: "#f9f9f9",
        "on-background": "#1a1c1c",

        surface: "#f9f9f9",
        "surface-dim": "#dadada",
        "surface-bright": "#f9f9f9",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f3f3f3",
        "surface-container": "#eeeeee",
        "surface-container-high": "#e8e8e8",
        "surface-container-highest": "#e2e2e2",
        "surface-variant": "#e2e2e2",
        "on-surface": "#1a1c1c",
        "on-surface-variant": "#544342",
        "inverse-surface": "#2f3131",
        "inverse-on-surface": "#f1f1f1",
        "inverse-primary": "#ffb3b0",

        outline: "#877271",
        "outline-variant": "#d9c1bf",
        "surface-tint": "#934746",

        // Semantic colors
        success: "#10b981",
        warning: "#f59e0b",
      },
      borderRadius: {
        sm: "0.5rem",
        DEFAULT: "1rem",
        md: "1.5rem",
        lg: "2rem",
        xl: "3rem",
        full: "9999px",
      },
      spacing: {
        base: "8px",
        xs: "4px",
        sm: "12px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        "2xl": "48px",
        gutter: "16px",
        "margin-mobile": "20px",
      },
      fontFamily: {
        headline: ["Karla"],
        body: ["Inter"],
      },
      fontSize: {
        "headline-xl": ["40px", { lineHeight: "44px", letterSpacing: "-0.04em", fontWeight: "800" }],
        "headline-lg": ["32px", { lineHeight: "36px", letterSpacing: "-0.03em", fontWeight: "800" }],
        "headline-lg-mobile": ["28px", { lineHeight: "32px", letterSpacing: "-0.02em", fontWeight: "800" }],
        "headline-md": ["24px", { lineHeight: "28px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "body-lg": ["18px", { lineHeight: "28px", letterSpacing: "0", fontWeight: "400" }],
        "body-md": ["16px", { lineHeight: "24px", letterSpacing: "0", fontWeight: "400" }],
        "label-md": ["14px", { lineHeight: "20px", letterSpacing: "0.02em", fontWeight: "600" }],
        "label-sm": ["12px", { lineHeight: "16px", letterSpacing: "0.05em", fontWeight: "500" }],
      },
      boxShadow: {
        soft: "0 8px 24px rgba(0,0,0,0.06)",
        "soft-lg": "0 8px 24px rgba(0,0,0,0.10)",
      },
    },
  },
  plugins: [],
}
