import type { Config } from "tailwindcss";

// Night-sky navy / white / lime (2026-11-12 redesign, from ahmet's leaderboard mockup):
//   navy   page background, dark voxel-world night sky
//   cream  (near white) main text
//   lime   the one accent: main buttons, ranks, active tabs, +1 credit, glows. Never large flat areas.
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: "#061427", deep: "#040d1c" }, // page background
        panel: "#13213a", // filled controls (inputs, thumbnails while loading)
        line: "#22304d", // hairlines and control borders
        cream: { DEFAULT: "#f2f5ec", deep: "#dfe5d6" }, // main text
        mute: "#aab3c3", // secondary text
        faint: "#7d889c", // tertiary text, captions
        lime: { DEFAULT: "#c8f031", deep: "#b2db17", ink: "#c8f031" }, // main actions and highlights
        verified: "#4fd1a5", // tiny live/verified status dots only, never large areas
        danger: "#ff8fa3",
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        // Two layers (tight contact + wide soft) so raised things feel physically above the page.
        lift: "0 1px 2px rgba(0,0,0,.35), 0 18px 40px -12px rgba(0,0,0,.65)",
        glow: "0 0 0 1px rgba(200,240,49,.35), 0 0 24px -2px rgba(200,240,49,.55)",
      },
      borderRadius: { media: "12px", ctl: "10px" }, // concentric: inner radius = outer radius minus the padding between them
      keyframes: {
        rise: { "0%": { opacity: "0", transform: "translateY(8px) scale(.9)" }, "20%": { opacity: "1", transform: "translateY(0) scale(1.08)" }, "100%": { opacity: "0", transform: "translateY(-36px) scale(1)" } },
        pop: { "0%": { transform: "scale(1)" }, "40%": { transform: "scale(1.18)" }, "100%": { transform: "scale(1)" } },
        fade: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        "rise-in": { "0%": { opacity: "0", transform: "translateY(10px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        fill: { "0%": { width: "0%" }, "100%": { width: "100%" } },
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-10px)" } },
        halo: { "0%,100%": { opacity: ".55", transform: "scale(1)" }, "50%": { opacity: ".9", transform: "scale(1.08)" } },
        shine: { "0%": { transform: "translateX(-120%) skewX(-20deg)" }, "60%,100%": { transform: "translateX(220%) skewX(-20deg)" } },
        drift: { "0%": { transform: "translateY(0)", opacity: "0" }, "10%": { opacity: "var(--o)" }, "90%": { opacity: "var(--o)" }, "100%": { transform: "translateY(-110vh)", opacity: "0" } },
        "podium-in": { "0%": { opacity: "0", transform: "translateY(40px) scale(.92)" }, "70%": { opacity: "1", transform: "translateY(-6px) scale(1.02)" }, "100%": { opacity: "1", transform: "translateY(0) scale(1)" } },
        spark: { "0%": { opacity: "1", transform: "translate(0,0) scale(1)" }, "100%": { opacity: "0", transform: "translate(var(--dx),var(--dy)) scale(.4)" } },
      },
      animation: {
        rise: "rise 1.6s ease-out forwards",
        pop: "pop .45s ease-out",
        spark: "spark .8s ease-out forwards",
        fade: "fade .5s ease-out both",
        float: "float 4.5s ease-in-out infinite",
        halo: "halo 3s ease-in-out infinite",
        shine: "shine 3.5s ease-in-out infinite",
        "podium-in": "podium-in .8s cubic-bezier(.2,.7,.2,1) both",
        "rise-in": "rise-in .45s cubic-bezier(.2,.7,.2,1) both",
      },
    },
  },
  plugins: [],
} satisfies Config;
