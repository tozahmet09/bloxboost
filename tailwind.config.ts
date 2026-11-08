import type { Config } from "tailwindcss";

// Navy / cream / coral, split 60/30/10:
//   navy  60%  page background and dark surfaces
//   cream 30%  text, plus the light bands (developer section, footer)
//   coral 10%  the one accent: main buttons, +1 credit badge, accent links. Never large areas.
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#0f1a2e", // page background
        panel: "#172540", // filled controls (inputs, thumbnails while loading)
        line: "#253556", // hairlines and control borders
        cream: { DEFAULT: "#f5eee3", deep: "#e9dfcf" }, // main text; light bands
        mute: "#bdb6ab", // secondary text (dimmed cream)
        faint: "#8791a3", // tertiary text, captions
        coral: { DEFAULT: "#ff7a63", deep: "#f0614a", ink: "#c7432f" }, // main actions; `ink` = coral text on cream
        verified: "#4fd1a5", // tiny live/verified status dots only, never large areas
        danger: "#ff8fa3",
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: { media: "12px", ctl: "10px" },
      keyframes: {
        rise: { "0%": { opacity: "0", transform: "translateY(8px) scale(.9)" }, "20%": { opacity: "1", transform: "translateY(0) scale(1.08)" }, "100%": { opacity: "0", transform: "translateY(-36px) scale(1)" } },
        pop: { "0%": { transform: "scale(1)" }, "40%": { transform: "scale(1.18)" }, "100%": { transform: "scale(1)" } },
        spark: { "0%": { opacity: "1", transform: "translate(0,0) scale(1)" }, "100%": { opacity: "0", transform: "translate(var(--dx),var(--dy)) scale(.4)" } },
      },
      animation: {
        rise: "rise 1.6s ease-out forwards",
        pop: "pop .45s ease-out",
        spark: "spark .8s ease-out forwards",
      },
    },
  },
  plugins: [],
} satisfies Config;
