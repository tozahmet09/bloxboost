import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { rateLimit } from "@/lib/ratelimit";
import { OAUTH_COOKIE, robloxOauthEnabled, startAuth } from "@/lib/robloxOauth";

export const dynamic = "force-dynamic";

// The "Sign in with Roblox" button lands here; we send the user to Roblox's own consent page.
export async function GET(req: NextRequest) {
  const origin = new URL(req.url).origin;
  const user = await getUser();
  if (!user) return NextResponse.redirect(new URL("/login", origin));
  if (!robloxOauthEnabled()) return NextResponse.redirect(new URL("/dashboard/roblox", origin));
  if (!(await rateLimit(`roblox-oauth:${user.id}`, 20, 10 * 60e3)))
    return NextResponse.redirect(new URL("/dashboard/roblox?error=slow", origin));
  const { url, cookie } = startAuth(origin);
  const res = NextResponse.redirect(url);
  res.cookies.set(OAUTH_COOKIE, cookie, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/api/roblox",
  });
  return res;
}
