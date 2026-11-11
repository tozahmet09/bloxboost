import type { MetadataRoute } from "next";

const base = (process.env.APP_URL || "https://spawnswap.com").replace(/\/+$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/admin", "/dashboard", "/go/", "/reset-password", "/forgot-password"] },
    sitemap: `${base}/sitemap.xml`,
  };
}
