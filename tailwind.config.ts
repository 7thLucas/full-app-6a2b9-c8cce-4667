import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "doge-yellow": "#F5C518",
        "doge-brown": "#8B4513",
        "doge-cream": "#FFF8E7",
        "doge-dark": "#1A1A2E",
        "doge-card": "#16213E",
        "doge-accent": "#E94560",
        "doge-green": "#00D084",
        "doge-blue": "#0F3460",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "bounce-gentle": "bounce 2s infinite",
        "shimmer": "shimmer 2s linear infinite",
        "scan": "scan 2s linear infinite",
        "pop-in": "pop-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        scan: {
          "0%": { top: "0%" },
          "100%": { top: "100%" },
        },
        "pop-in": {
          "0%": { transform: "scale(0)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
