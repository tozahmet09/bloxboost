import { NextRequest, NextResponse } from "next/server";
import { heartbeat } from "@/lib/credits";

// Called by the in-game tracker script about once a minute.
// Body: { secret: string, players: number[] }  (Roblox user ids in this server)
export async function POST(req: NextRequest) {
  let body: { secret?: unknown; players?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  if (typeof body.secret !== "string" || body.secret.length > 64) return NextResponse.json({ error: "missing secret" }, { status: 400 });
  // A Roblox server holds at most a couple of hundred players; ignore anything beyond that.
  const ids = Array.isArray(body.players) ? body.players.slice(0, 200).map(String).filter((s) => /^\d{1,20}$/.test(s)) : [];
  const r = await heartbeat(body.secret, ids);
  if (!r) return NextResponse.json({ error: "unknown game" }, { status: 404 });
  return NextResponse.json({ ok: true, ...r });
}
