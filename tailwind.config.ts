import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0A0C10",
        surface: "#12151D",
        "surface-subtle": "#181C26",
        border: "rgba(255, 255, 255, 0.08)",
        accent: "#C5A880",
        "accent-hover": "#D4B993",
        "accent-muted": "rgba(197, 168, 128, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
