import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { presenceTick } from "@/lib/credits";
import { rateLimit } from "@/lib/ratelimit";

// Polled about once a minute by the "My progress" page. Counts playtime for games without the tracker script.
export async function POST() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "login required" }, { status: 401 });
  // The page polls once a minute; anything much faster is someone hammering Roblox through us.
  if (!(await rateLimit(`presence:${user.id}`, 4, 60e3))) return NextResponse.json({ error: "slow down" }, { status: 429 });
  try {
    return NextResponse.json({ ok: true, ...(await presenceTick()) });
  } catch (e) {
    console.error("presence tick failed", e);
    return NextResponse.json({ error: "roblox unavailable" }, { status: 502 });
  }
}
