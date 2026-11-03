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
  if (typeof body.secret !== "string") return NextResponse.json({ error: "missing secret" }, { status: 400 });
  const ids = Array.isArray(body.players) ? body.players.map(String).filter((s) => /^\d{1,20}$/.test(s)) : [];
  const r = await heartbeat(body.secret, ids);
  if (!r) return NextResponse.json({ error: "unknown game" }, { status: 404 });
  return NextResponse.json({ ok: true, ...r });
}
