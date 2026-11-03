import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recordClick, visitorHash } from "@/lib/ads";
import { robloxGameUrl } from "@/lib/roblox";

// Tracks a click, charges the campaign (if any), then sends the player to Roblox.
export async function GET(req: NextRequest, { params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  const game = await db.game.findUnique({ where: { id: gameId } });
  if (!game) return NextResponse.redirect(new URL("/", req.url));

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
  const ua = req.headers.get("user-agent") ?? "";
  const isBot = /bot|crawl|spider|preview|curl|wget/i.test(ua);
  if (!isBot) {
    const campaignId = req.nextUrl.searchParams.get("c");
    await recordClick(game.id, campaignId, visitorHash(ip, ua));
  }
  return NextResponse.redirect(robloxGameUrl(game.placeId), 302);
}
