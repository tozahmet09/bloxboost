import { NextResponse } from "next/server";
import { presenceTick } from "@/lib/credits";
import { rateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

/**
 * Called once a minute by an outside scheduler (cron-job.org), so script-free playtime keeps
 * counting while the player has the Roblox app open and our page is in the background
 * (on phones the browser stops running pages it doesn't show).
 * It only asks Roblox who is in a game and can't give anyone anything, so it needs no login.
 * If CRON_SECRET is set, callers must send it as ?key= or a Bearer token.
 */
async function run(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const key = new URL(req.url).searchParams.get("key") ?? req.headers.get("authorization")?.replace(/^Bearer /, "");
    if (key !== secret) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  // One scheduler hit a minute is plenty; extra callers just get turned away instead of hammering Roblox.
  if (!(await rateLimit("presence:cron", 3, 60e3))) return NextResponse.json({ ok: true, skipped: true });
  try {
    let checked = 0;
    let counted = 0;
    // presenceTick looks at 50 waiting tasks per call; go a few rounds when more people are playing.
    for (let i = 0; i < 4; i++) {
      const r = await presenceTick();
      checked += r.checked;
      counted += r.counted ?? 0;
      if (r.checked < 50) break;
    }
    return NextResponse.json({ ok: true, checked, counted });
  } catch (e) {
    console.error("cron presence tick failed", e);
    return NextResponse.json({ error: "roblox unavailable" }, { status: 502 });
  }
}

export const GET = run;
export const POST = run;
