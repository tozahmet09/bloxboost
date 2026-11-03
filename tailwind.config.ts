import type { Config } from "tailwindcss";

// "Marquee": a dark cinema for new games. One accent (marquee amber) for main actions only.
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#120f17", // page background, warm aubergine-black
        panel: "#1b1722", // raised surfaces
        line: "#2d2738", // hairlines and borders
        cream: "#f2ece4", // main text
        mute: "#a69db0", // secondary text
        marquee: { DEFAULT: "#ffb238", deep: "#e89a1c" }, // main actions
        verified: "#4fd1a5", // verified / live status only
        velvet: "#e2574c", // featured badge
        danger: "#ff8a7a",
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: { media: "14px", ctl: "10px" },
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
