import "server-only";
import { createHash, randomBytes } from "crypto";
import { db } from "./db";

// "Sign in with Roblox" (Roblox OAuth 2.0). We only ask for "openid profile": Roblox tells us
// the account's id, username and age. No password, no Robux, no items.
// Set up in docs/ROBLOX_OAUTH.md. Without the two env vars the button is hidden and the
// old "paste a code in your About" way still works.

const AUTHORIZE = "https://apis.roblox.com/oauth/v1/authorize";
const TOKEN = "https://apis.roblox.com/oauth/v1/token";
const USERINFO = "https://apis.roblox.com/oauth/v1/userinfo";
export const OAUTH_COOKIE = "rbx_oauth";

export function robloxOauthEnabled() {
  return Boolean(process.env.ROBLOX_OAUTH_CLIENT_ID && process.env.ROBLOX_OAUTH_CLIENT_SECRET);
}

export function callbackUrl(origin: string) {
  const base = process.env.APP_URL?.trim().replace(/\/+$/, "") || origin;
  return `${base}/api/roblox/callback`;
}

const b64url = (b: Buffer) => b.toString("base64url");

/** A fresh state + PKCE verifier, and the Roblox URL to send the user to. */
export function startAuth(origin: string) {
  const state = b64url(randomBytes(24));
  const verifier = b64url(randomBytes(48));
  const challenge = b64url(createHash("sha256").update(verifier).digest());
  const q = new URLSearchParams({
    client_id: process.env.ROBLOX_OAUTH_CLIENT_ID!,
    redirect_uri: callbackUrl(origin),
    scope: "openid profile",
    response_type: "code",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });
  return { url: `${AUTHORIZE}?${q}`, cookie: `${state}.${verifier}` };
}

export type RobloxIdentity = { id: string; name: string; created: Date | null };

/** Trade the one-time code for the Roblox account it belongs to. */
export async function finishAuth(code: string, verifier: string, origin: string): Promise<RobloxIdentity> {
  const tok = await fetch(TOKEN, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.ROBLOX_OAUTH_CLIENT_ID!,
      client_secret: process.env.ROBLOX_OAUTH_CLIENT_SECRET!,
      grant_type: "authorization_code",
      code,
      code_verifier: verifier,
      redirect_uri: callbackUrl(origin),
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if (!tok.ok) throw new Error(`Roblox token ${tok.status}`);
  const { access_token } = await tok.json();
  if (!access_token) throw new Error("No access token");
  const r = await fetch(USERINFO, { headers: { authorization: `Bearer ${access_token}` }, cache: "no-store", signal: AbortSignal.timeout(10000) });
  if (!r.ok) throw new Error(`Roblox userinfo ${r.status}`);
  const u = await r.json();
  if (!u.sub) throw new Error("No Roblox user id");
  const created = typeof u.created_at === "number" ? new Date(u.created_at * 1000) : null;
  return { id: String(u.sub), name: String(u.preferred_username || u.name || u.sub), created };
}

/**
 * Link a Roblox account to a site account once ownership is proven (by OAuth or the About code).
 * Returns false if another site account already has it.
 */
export async function linkRoblox(userId: string, rbx: RobloxIdentity) {
  const taken = await db.user.findFirst({ where: { robloxUserId: rbx.id, robloxVerified: true, NOT: { id: userId } } });
  if (taken) return false;
  await db.$transaction([
    // release the id from any unverified holder
    db.user.updateMany({ where: { robloxUserId: rbx.id, NOT: { id: userId } }, data: { robloxUserId: null } }),
    db.user.update({
      where: { id: userId },
      data: { robloxUserId: rbx.id, robloxUsername: rbx.name, robloxVerified: true, robloxVerifyCode: null, robloxCreatedAt: rbx.created },
    }),
  ]);
  return true;
}
