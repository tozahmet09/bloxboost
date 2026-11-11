import type { MetadataRoute } from "next";
import { GUIDES } from "@/lib/guides";

const base = (process.env.APP_URL || "https://spawnswap.com").replace(/\/+$/, "");

// Public, indexable pages only. Game pages change often and are found through links.
export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/how-it-works", "/guides", "/leaderboard", "/terms", "/privacy", "/refund", "/contact"];
  return [
    ...pages.map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.6 })),
    ...GUIDES.map((g) => ({ url: `${base}/guides/${g.slug}`, lastModified: g.updated, changeFrequency: "monthly" as const, priority: 0.8 })),
  ];
}
