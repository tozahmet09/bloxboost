import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { presenceTick } from "@/lib/credits";

// Polled about once a minute by the "My progress" page. Counts playtime for games without the tracker script.
export async function POST() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "login required" }, { status: 401 });
  try {
    return NextResponse.json({ ok: true, ...(await presenceTick()) });
  } catch (e) {
    console.error("presence tick failed", e);
    return NextResponse.json({ error: "roblox unavailable" }, { status: 502 });
  }
}
