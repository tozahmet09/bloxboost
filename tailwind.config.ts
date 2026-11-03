import type { Config } from "tailwindcss";
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { brand: { DEFAULT: "#22c55e", dark: "#16a34a" } },
    },
  },
  plugins: [],
} satisfies Config;
