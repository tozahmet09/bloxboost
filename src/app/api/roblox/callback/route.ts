import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { getUser } from "@/lib/auth";
import { finishAuth, linkRoblox, OAUTH_COOKIE, robloxOauthEnabled } from "@/lib/robloxOauth";

export const dynamic = "force-dynamic";

const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

// Roblox sends the user back here after they press "Allow" (or "Cancel").
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const back = (error?: string) => {
    const res = NextResponse.redirect(new URL(error ? `/dashboard/roblox?error=${error}` : "/play", url.origin));
    res.cookies.set(OAUTH_COOKIE, "", { maxAge: 0, path: "/api/roblox" });
    return res;
  };
  const user = await getUser();
  if (!user) return NextResponse.redirect(new URL("/login", url.origin));
  if (!robloxOauthEnabled()) return back("off");
  if (url.searchParams.get("error")) return back("cancelled");

  const [state, verifier] = (req.cookies.get(OAUTH_COOKIE)?.value ?? "").split(".");
  const code = url.searchParams.get("code") ?? "";
  const gotState = url.searchParams.get("state") ?? "";
  if (!state || !verifier || !code || !same(state, gotState)) return back("expired");

  let rbx;
  try {
    rbx = await finishAuth(code, verifier, url.origin);
  } catch (e) {
    console.error("Roblox OAuth failed", e);
    return back("roblox");
  }
  if (!(await linkRoblox(user.id, rbx))) return back("taken");
  return back();
}
