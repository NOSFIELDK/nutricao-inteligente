/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        bg: "hsl(var(--bg) / <alpha-value>)",
        fg: "hsl(var(--fg) / <alpha-value>)",
        muted: "hsl(var(--muted) / <alpha-value>)",
        card: "hsl(var(--card) / <alpha-value>)",
        "card-2": "hsl(var(--card-2) / <alpha-value>)",
        border: "hsl(var(--border) / <alpha-value>)",
        accent: "hsl(var(--accent) / <alpha-value>)",
        "accent-2": "hsl(var(--accent-2) / <alpha-value>)",
        // ── Cores extras da logo LeifNutri ──
        gold: "hsl(var(--gold) / <alpha-value>)",
        "viking-blue": "hsl(var(--viking-blue) / <alpha-value>)",
        rust: "hsl(var(--rust) / <alpha-value>)",
        bone: "hsl(var(--bone) / <alpha-value>)",
        "forest-dark": "hsl(var(--forest-dark) / <alpha-value>)",
        steel: "hsl(var(--steel) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        display: ["var(--font-display)"],
      },
      borderRadius: {
        xl: "var(--radius)",
        lg: "var(--radius-sm)",
      },
      boxShadow: {
        soft: "0 20px 60px hsl(var(--shadow) / 0.18)",
        crisp: "0 10px 30px hsl(var(--shadow) / 0.12)",
      },
      keyframes: {
        "page-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "bar-fill": {
          "0%": { transform: "scaleX(0)" },
          "100%": { transform: "scaleX(1)" },
        },
      },
      animation: {
        "page-in": "page-in 0.28s cubic-bezier(0.22,1,0.36,1) both",
        "fade-up": "fade-up 0.32s cubic-bezier(0.22,1,0.36,1) both",
        "bar-fill": "bar-fill 0.7s cubic-bezier(0.22,1,0.36,1) both",
      },
    },
  },
  plugins: [],
};
