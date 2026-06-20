/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,tsx,ts}",
  ],
  theme: {
    extend: {
      colors: {
        // OctoScore Elite design system
        octo: {
          bg: "#0A0A0A",        // app background (near-black)
          surface: "#0F0F12",   // neutral surface
          card: "#141418",      // elevated card
          elevated: "#1B1B20",  // option / inner card
          purple: "#6236FF",    // primary
          green: "#39FF14",     // secondary (scores, highlights)
          cyan: "#00E5FF",      // tertiary (sparingly)
          gold: "#FFC700",      // navigation accent
        },
      },
      fontFamily: {
        display: ['"Barlow Condensed"', "system-ui", "sans-serif"], // headlines / scores
        sans: ['"Hanken Grotesk"', "system-ui", "sans-serif"],      // body
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],    // labels / numbers
      },
      boxShadow: {
        nav: "0 12px 35px -8px rgba(0,0,0,0.8)",
        "glow-purple": "0 0 30px -8px rgba(98,54,255,0.65)",
        "glow-green": "0 0 26px -8px rgba(57,255,20,0.45)",
        card: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 18px 40px -24px rgba(0,0,0,0.9)",
      },
      backgroundImage: {
        "grid-faint":
          "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
      },
      keyframes: {
        "pulse-live": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.4", transform: "scale(0.8)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "glow-breathe": {
          "0%, 100%": { opacity: "0.45" },
          "50%": { opacity: "0.8" },
        },
      },
      animation: {
        "pulse-live": "pulse-live 1.2s ease-in-out infinite",
        "fade-up": "fade-up 0.5s cubic-bezier(0.22,1,0.36,1) both",
        shimmer: "shimmer 2.5s linear infinite",
        float: "float 6s ease-in-out infinite",
        "glow-breathe": "glow-breathe 5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
}
