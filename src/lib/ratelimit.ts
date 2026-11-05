import "server-only";
import { headers } from "next/headers";
import { db } from "./db";

/**
 * Allows at most `max` hits for `key` in the last `windowMs`. Returns false when over the limit.
 * Stored in the database so it works across Vercel's many serverless instances.
 */
export async function rateLimit(key: string, max: number, windowMs: number) {
  const since = new Date(Date.now() - windowMs);
  const hits = await db.rateHit.count({ where: { key, createdAt: { gt: since } } });
  if (hits >= max) return false;
  await db.rateHit.create({ data: { key } });
  // Now and then, drop rows nobody needs any more.
  if (Math.random() < 0.02) await db.rateHit.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 864e5) } } }).catch(() => {});
  return true;
}

/** The visitor's IP as Vercel reports it (x-real-ip can't be faked by the browser there). */
export async function clientIp() {
  const h = await headers();
  return h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}
