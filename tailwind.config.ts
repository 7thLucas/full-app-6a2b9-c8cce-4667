import type { Config } from "tailwindcss";

// Tailwind v4 is configured CSS-first via the @theme block in app/globals.css
// (palette, fonts, animations). This file only declares content sources.
const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
};

export default config;
