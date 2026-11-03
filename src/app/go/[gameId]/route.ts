import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { visitorHash } from "@/lib/credits";
import { today } from "@/lib/money";
import { robloxGameUrl } from "@/lib/roblox";

// Logs a visit from the discovery page, then sends the player to the game on Roblox.
export async function GET(req: NextRequest, { params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  const game = await db.game.findUnique({ where: { id: gameId } });
  if (!game) return NextResponse.redirect(new URL("/", req.url));
  const ua = req.headers.get("user-agent") ?? "";
  if (!/bot|crawl|spider|preview|curl|wget/i.test(ua)) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
    const vh = visitorHash(ip, ua);
    const day = today();
    const seen = await db.visit.findFirst({ where: { gameId, visitorHash: vh, day } });
    if (!seen)
      await db.visit.create({
        data: { gameId, visitorHash: vh, day, featured: !!game.featuredUntil && game.featuredUntil > new Date() },
      });
  }
  return NextResponse.redirect(robloxGameUrl(game.placeId), 302);
}
