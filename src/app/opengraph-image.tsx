import { ImageResponse } from "next/og";

export const alt = "Spawnswap: new Roblox games, before they blow up";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Share image for links on Discord, X, etc. Same look as the site: dark, one amber accent, no decoration. */
export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#0b1426", padding: 80, color: "#f2f5ec", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 34, fontWeight: 700 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "#c8f031", color: "#0b1426", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 800 }}>S</div>
          Spawnswap
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 76, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>
          <div>New Roblox games,</div>
          <div style={{ color: "#bdb6ab" }}>before they blow up.</div>
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#bdb6ab" }}>
          <span style={{ color: "#c8f031", marginRight: 12 }}>Play 10 min = 1 credit.</span> 1 credit = 1 real player for your game.
        </div>
      </div>
    ),
    size,
  );
}
