import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: "#0E1E33",
        "navy-deep": "#0B1830",
        gold: "#B8935F",
        slate: "#5C6470",
      },
    },
  },
  plugins: [],
};

export default config;
