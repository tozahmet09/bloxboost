"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createHash, randomBytes } from "crypto";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { createSession, destroySession, getUser, hashPassword, requireUser, verifyPassword } from "@/lib/auth";
import { linkRoblox } from "@/lib/robloxOauth";
import { fetchRobloxGame, lookupRobloxUser, parsePlaceId, robloxProfile } from "@/lib/roblox";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { completeTask, startTask } from "@/lib/credits";
import { del } from "@vercel/blob";
import { isOwnUpload, parseTrailer } from "@/lib/trailer";
import { checkTrailer } from "@/lib/trailerCheck";
import { requireAdmin } from "@/lib/admin";
import { COMMENT_COOLDOWN_MS, COMMENT_MAX_CHARS, EARLY_BIRD_ACCOUNTS, EARLY_BIRD_CREDITS, MIN_FEEDBACK_CHARS, REFERRAL_CREDITS } from "@/lib/money";
import { emailEnabled, sendEmail } from "@/lib/email";
import { operator } from "@/lib/legal";
import { daysUntil, parseReleaseDate } from "@/lib/release";

export type FormState = { error?: string; ok?: string } | undefined;

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const TOO_FAST = "Too many tries. Wait a few minutes and try again.";

// ---------- accounts ----------

export async function signup(_: FormState, f: FormData): Promise<FormState> {
  const email = str(f, "email").toLowerCase();
  const password = str(f, "password");
  const displayName = str(f, "displayName") || email.split("@")[0];
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Enter a valid email." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (f.get("agree") !== "on") return { error: "Please confirm you're 13 or older and accept the Terms." };
  if (email.length > 200 || displayName.length > 40) return { error: "That's too long." };
  if (!(await rateLimit(`signup:${await clientIp()}`, 5, 3600e3))) return { error: TOO_FAST };
  if (await db.user.findUnique({ where: { email } })) return { error: "That email is already registered." };
  const passwordHash = await hashPassword(password);
  const ref = str(f, "ref").toLowerCase();
  const inviter = ref ? await db.user.findFirst({ where: { referralCode: ref }, select: { id: true } }) : null;
  const user = await db.$transaction(async (tx) => {
    const early = (await tx.user.count()) < EARLY_BIRD_ACCOUNTS;
    const credits = (early ? EARLY_BIRD_CREDITS : 0) + (inviter ? REFERRAL_CREDITS : 0);
    return tx.user.create({ data: { email, displayName, passwordHash, credits, referredById: inviter?.id ?? null } });
  });
  await createSession(user.id);
  redirect("/dashboard");
}

export async function login(_: FormState, f: FormData): Promise<FormState> {
  const email = str(f, "email").toLowerCase();
  const ip = await clientIp();
  // Slow down password guessing, per address and per account.
  if (!(await rateLimit(`login-ip:${ip}`, 20, 15 * 60e3)) || !(await rateLimit(`login:${email}`, 8, 15 * 60e3)))
    return { error: TOO_FAST };
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(str(f, "password"), user.passwordHash)))
    return { error: "Wrong email or password." };
  await createSession(user.id);
  redirect("/dashboard");
}

// ---------- forgot password ----------

const RESET_MINUTES = 60;
const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");

async function siteUrl() {
  const fromEnv = process.env.APP_URL?.trim().replace(/\/+$/, "");
  if (fromEnv) return fromEnv;
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
}

/**
 * Emails a one-time reset link. The answer is the same whether or not the email has an account,
 * so nobody can use this form to find out who is signed up.
 */
export async function requestPasswordReset(_: FormState, f: FormData): Promise<FormState> {
  const email = str(f, "email").toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 200) return { error: "Enter a valid email." };
  if (!(await rateLimit(`reset-ip:${await clientIp()}`, 10, 3600e3)) || !(await rateLimit(`reset:${email}`, 3, 3600e3)))
    return { error: TOO_FAST };
  if (!emailEnabled() && process.env.NODE_ENV === "production") {
    const contact = operator().email;
    return { error: `Password reset emails aren't switched on yet. ${contact ? `Write to ${contact} and we'll help you get back in.` : "Please contact us and we'll help you get back in."}` };
  }
  const sent = { ok: `If an account uses ${email}, we've sent it a reset link. It works for ${RESET_MINUTES} minutes. Check your spam folder too.` };

  const user = await db.user.findUnique({ where: { email }, select: { id: true, displayName: true } });
  if (!user) return sent;

  const token = randomBytes(32).toString("base64url");
  // Only the newest link works.
  await db.passwordReset.deleteMany({ where: { userId: user.id } });
  await db.passwordReset.create({
    data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + RESET_MINUTES * 60e3) },
  });
  const link = `${await siteUrl()}/reset-password?token=${token}`;
  const text = `Hi ${user.displayName},\n\nSomeone (hopefully you) asked to reset your Spawnswap password. Open this link to choose a new one:\n\n${link}\n\nThe link works once, for ${RESET_MINUTES} minutes. If you didn't ask for this, you can ignore this email and your password stays the same.`;
  const html = `<p>Hi ${escapeHtml(user.displayName)},</p><p>Someone (hopefully you) asked to reset your Spawnswap password.</p><p><a href="${link}" style="display:inline-block;padding:10px 18px;background:#ff7a63;color:#0f1a2e;border-radius:8px;text-decoration:none;font-weight:600">Choose a new password</a></p><p>Or paste this link into your browser:<br>${link}</p><p>The link works once, for ${RESET_MINUTES} minutes. If you didn't ask for this, ignore this email and your password stays the same.</p>`;
  const ok = await sendEmail(email, "Reset your Spawnswap password", text, html);
  if (!ok && emailEnabled()) return { error: "We couldn't send the email just now. Try again in a few minutes." };
  return sent;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Sets the new password from a reset link. The link is used up, and every other login is signed out. */
export async function resetPassword(_: FormState, f: FormData): Promise<FormState> {
  const token = str(f, "token");
  const password = str(f, "password");
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== str(f, "confirm")) return { error: "The two passwords don't match." };
  if (!(await rateLimit(`reset-use:${await clientIp()}`, 20, 15 * 60e3))) return { error: TOO_FAST };
  const expired = { error: "This reset link has expired or was already used. Ask for a new one on the Forgot password page." };
  if (!token) return expired;

  const reset = await db.passwordReset.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!reset || reset.usedAt || reset.expiresAt < new Date()) return expired;

  const passwordHash = await hashPassword(password);
  const done = await db.$transaction(async (tx) => {
    // Marking it used only if it still isn't makes the link single-use even if it is opened twice at once.
    const claimed = await tx.passwordReset.updateMany({ where: { id: reset.id, usedAt: null }, data: { usedAt: new Date() } });
    if (claimed.count !== 1) return false;
    await tx.user.update({ where: { id: reset.userId }, data: { passwordHash } });
    await tx.session.deleteMany({ where: { userId: reset.userId } });
    await tx.passwordReset.deleteMany({ where: { userId: reset.userId, id: { not: reset.id } } });
    return true;
  });
  if (!done) return expired;
  await createSession(reset.userId);
  redirect("/dashboard?reset=1");
}

/**
 * The user deletes their own account. Their games, likes, comments and open plays are removed.
 * Payment rows stay (tax law), so the user row is kept but wiped: no email, name, password or Roblox link left.
 * Finished plays stay as anonymous counts so other developers' player totals don't drop, but the review text goes.
 */
export async function deleteAccount(_: FormState, f: FormData): Promise<FormState> {
  const user = await requireUser();
  if (!(await rateLimit(`delete:${user.id}`, 5, 15 * 60e3))) return { error: TOO_FAST };
  if (!(await verifyPassword(str(f, "password"), user.passwordHash))) return { error: "Wrong password." };
  if (f.get("confirm") !== "on") return { error: "Tick the box to confirm." };

  const games = await db.game.findMany({ where: { ownerId: user.id }, select: { id: true, trailerUrl: true, pendingTrailerUrl: true } });
  const lockedPassword = await hashPassword(randomBytes(32).toString("hex"));
  await db.$transaction(async (tx) => {
    // Likes are also stored as counters on the game or comment, so take this user's likes off those first.
    const likes = await tx.like.findMany({ where: { userId: user.id }, select: { gameId: true } });
    if (likes.length) await tx.game.updateMany({ where: { id: { in: likes.map((l) => l.gameId) } }, data: { likeCount: { decrement: 1 } } });
    const commentLikes = await tx.commentLike.findMany({ where: { userId: user.id }, select: { commentId: true } });
    if (commentLikes.length)
      await tx.comment.updateMany({ where: { id: { in: commentLikes.map((l) => l.commentId) } }, data: { likeCount: { decrement: 1 } } });
    await tx.like.deleteMany({ where: { userId: user.id } });
    await tx.commentLike.deleteMany({ where: { userId: user.id } });
    await tx.comment.deleteMany({ where: { userId: user.id } });
    // Unfinished plays free their slot for someone else; finished ones lose the review text and Roblox id.
    await tx.playTask.deleteMany({ where: { playerId: user.id, status: { not: "COMPLETED" } } });
    await tx.playTask.updateMany({ where: { playerId: user.id }, data: { feedback: null, robloxUserId: "deleted" } });
    await tx.game.deleteMany({ where: { ownerId: user.id } }); // also removes their campaigns, plays, visits, likes and comments
    await tx.session.deleteMany({ where: { userId: user.id } });
    await tx.user.update({
      where: { id: user.id },
      data: {
        email: `deleted-${user.id}@deleted.invalid`,
        displayName: "Deleted user",
        passwordHash: lockedPassword,
        credits: 0,
        robloxUserId: null,
        robloxUsername: null,
        robloxVerifyCode: null,
        robloxVerified: false,
        robloxCreatedAt: null,
        referralCode: null,
      },
    });
  });
  if (process.env.BLOB_READ_WRITE_TOKEN)
    for (const g of games)
      for (const u of [g.trailerUrl, g.pendingTrailerUrl]) if (isOwnUpload(u, g.id)) await del(u!).catch(() => {});
  await destroySession();
  redirect("/?deleted=1");
}

// ---------- Roblox account linking ----------

export async function startRobloxLink(_: FormState, f: FormData): Promise<FormState> {
  const user = await requireUser();
  if (!(await rateLimit(`roblox:${user.id}`, 10, 10 * 60e3))) return { error: TOO_FAST };
  let u;
  try {
    u = await lookupRobloxUser(str(f, "username"));
  } catch {
    return { error: "Couldn't reach Roblox. Try again in a minute." };
  }
  if (!u) return { error: "No Roblox user with that name." };
  const taken = await db.user.findFirst({ where: { robloxUserId: u.id, robloxVerified: true, NOT: { id: user.id } } });
  if (taken) return { error: "That Roblox account is already linked to someone else." };
  await db.user.update({
    where: { id: user.id },
    data: {
      robloxUserId: null, // set only after verification (field is unique)
      robloxUsername: `${u.name}#${u.id}`,
      robloxVerified: false,
      robloxVerifyCode: `spawnswap-${randomBytes(3).toString("hex")}`,
    },
  });
  revalidatePath("/dashboard/roblox");
  return { ok: "Code created" };
}

export async function verifyRobloxLink(_: FormState): Promise<FormState> {
  const user = await requireUser();
  if (!user.robloxUsername || !user.robloxVerifyCode) return { error: "Enter your username first." };
  const [name, id] = user.robloxUsername.split("#");
  const skip = process.env.NODE_ENV !== "production" && process.env.ROBLOX_VERIFY_SKIP === "1";
  if (!(await rateLimit(`roblox:${user.id}`, 10, 10 * 60e3))) return { error: TOO_FAST };
  let robloxCreatedAt: Date | null = null;
  if (!skip) {
    let about = "";
    try {
      const p = await robloxProfile(id);
      about = p.description;
      robloxCreatedAt = p.created;
    } catch {
      return { error: "Couldn't reach Roblox. Try again in a minute." };
    }
    if (!about.includes(user.robloxVerifyCode))
      return { error: `We didn't find ${user.robloxVerifyCode} in your Roblox profile "About". Save it there and try again (it can take a minute to update).` };
  }
  if (!(await linkRoblox(user.id, { id, name, created: robloxCreatedAt })))
    return { error: "That Roblox account is already linked to someone else." };
  redirect("/play");
}

// ---------- games & campaigns (developer side) ----------

export async function addGame(_: FormState, f: FormData): Promise<FormState> {
  const user = await requireUser();
  const placeId = parsePlaceId(str(f, "placeUrl"));
  if (!placeId) return { error: "That doesn't look like a Roblox game link. Open your game on roblox.com and copy the address, like https://www.roblox.com/games/123456789/My-Game" };
  if (!(await rateLimit(`addgame:${user.id}`, 10, 3600e3))) return { error: TOO_FAST };

  const existing = await db.game.findUnique({ where: { placeId } });
  if (existing?.ownerId === user.id) redirect(`/dashboard/games/${existing.id}`);
  if (existing) {
    // Someone claimed it, never installed the script and never ran a campaign: let the real owner take it after a day.
    // (The script is optional now, so a game that's actually in use is never taken away.)
    const used = await db.campaign.count({ where: { gameId: existing.id } });
    const stale = !existing.scriptLastSeen && !used && existing.createdAt < new Date(Date.now() - 864e5);
    if (!stale) return { error: "This game was already added by another account. If it's yours, contact support." };
    await db.game.delete({ where: { id: existing.id } });
  }

  let info;
  try {
    info = await fetchRobloxGame(placeId);
  } catch {
    return { error: "Couldn't load that game from Roblox. Make sure it's public and try again." };
  }
  const game = await db.game.create({
    data: {
      ownerId: user.id,
      placeId,
      universeId: info.universeId,
      name: info.name,
      description: info.description.slice(0, 2000),
      iconUrl: info.iconUrl,
      playing: info.playing,
      visits: info.visits,
      genre: info.genre,
    },
  });
  redirect(`/dashboard/games/${game.id}`);
}

export async function createCampaign(_: FormState, f: FormData): Promise<FormState> {
  const user = await requireUser();
  const game = await db.game.findFirst({ where: { id: str(f, "gameId"), ownerId: user.id } });
  if (!game) return { error: "Pick one of your games." };
  if (game.hiddenAt) return { error: "This game is hidden. Show it again to start a campaign." };
  const n = parseInt(str(f, "players"), 10);
  if (!(n >= 1 && n <= 10000)) return { error: "Choose between 1 and 10,000 players." };
  const ok = await db.$transaction(async (tx) => {
    // Take the credits only if they are still there, in one step, so two clicks at once can't spend them twice.
    const paid = await tx.user.updateMany({ where: { id: user.id, credits: { gte: n } }, data: { credits: { decrement: n } } });
    if (!paid.count) return false;
    await tx.campaign.create({ data: { gameId: game.id, targetPlayers: n } });
    return true;
  });
  if (!ok) return { error: `You need ${n} credits. Play other games to earn them, or buy a pack.` };
  redirect(`/dashboard/games/${game.id}`);
}

export async function toggleCampaign(f: FormData) {
  const user = await requireUser();
  const c = await db.campaign.findFirst({ where: { id: str(f, "id"), game: { ownerId: user.id } }, include: { game: { select: { hiddenAt: true } } } });
  if (!c || !["ACTIVE", "PAUSED"].includes(c.status)) return;
  if (c.status === "PAUSED" && c.game.hiddenAt) return; // a hidden game gets no players
  await db.campaign.update({ where: { id: c.id }, data: { status: c.status === "ACTIVE" ? "PAUSED" : "ACTIVE" } });
  revalidatePath(`/dashboard/games/${c.gameId}`);
}

/** Stops a campaign and refunds slots nobody is currently using. */
export async function cancelCampaign(f: FormData) {
  const user = await requireUser();
  await db.$transaction(async (tx) => {
    const c = await tx.campaign.findFirst({ where: { id: str(f, "id"), game: { ownerId: user.id } } });
    if (!c || !["ACTIVE", "PAUSED"].includes(c.status)) return;
    const open = await tx.playTask.count({ where: { campaignId: c.id, status: { in: ["PENDING", "PLAYED"] } } });
    const refund = Math.max(0, c.targetPlayers - c.delivered - open);
    // Only the first of two simultaneous cancels gets to refund.
    const cancelled = await tx.campaign.updateMany({
      where: { id: c.id, status: { in: ["ACTIVE", "PAUSED"] } },
      data: { status: "CANCELLED", targetPlayers: c.delivered + open },
    });
    if (!cancelled.count) return;
    await tx.user.update({ where: { id: user.id }, data: { credits: { increment: refund } } });
  });
  revalidatePath("/dashboard");
}

/**
 * The dev hides their game (or shows it again). Hidden games leave every public page and the player queue.
 * Nothing is deleted: campaigns are paused with their credits kept, and likes, comments and reviews stay.
 */
export async function setGameHidden(f: FormData) {
  const user = await requireUser();
  const hide = str(f, "hide") === "1";
  const game = await db.game.findFirst({ where: { id: str(f, "gameId"), ownerId: user.id }, select: { id: true } });
  if (!game) return;
  await db.$transaction(async (tx) => {
    await tx.game.update({ where: { id: game.id }, data: { hiddenAt: hide ? new Date() : null } });
    if (hide) await tx.campaign.updateMany({ where: { gameId: game.id, status: "ACTIVE" }, data: { status: "PAUSED" } });
  });
  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/games/${game.id}`);
  redirect(`/dashboard/games/${game.id}?visibility=${hide ? "hidden" : "shown"}#visibility`);
}

export async function refreshGame(f: FormData) {
  const user = await requireUser();
  const g = await db.game.findFirst({ where: { id: str(f, "id"), ownerId: user.id } });
  if (!g) return;
  try {
    const info = await fetchRobloxGame(g.placeId);
    await db.game.update({
      where: { id: g.id },
      data: { name: info.name, iconUrl: info.iconUrl, playing: info.playing, visits: info.visits, genre: info.genre },
    });
  } catch {}
  revalidatePath(`/dashboard/games/${g.id}`);
}

/** Sets or clears the game's release date. While it's in the future the game shows under "Coming soon". */
export async function setReleaseDate(_: FormState, f: FormData): Promise<FormState> {
  const user = await requireUser();
  const game = await db.game.findFirst({ where: { id: str(f, "gameId"), ownerId: user.id }, select: { id: true } });
  if (!game) return { error: "Game not found." };
  const d = f.get("clear") ? null : parseReleaseDate(str(f, "releaseAt"));
  if (d === undefined) return { error: "Pick a date." };
  if (d) {
    const n = daysUntil(d);
    if (n < 1) return { error: "Pick a day after today. If it's already out, clear the date." };
    if (n > 366) return { error: "Pick a date within the next year." };
  }
  await db.game.update({ where: { id: game.id }, data: { releaseAt: d } });
  revalidatePath(`/dashboard/games/${game.id}`);
  revalidatePath("/");
  return { ok: d ? "Saved. Your game shows under Coming soon until that day." : "Release date cleared." };
}

export async function setTrailer(_: FormState, f: FormData): Promise<FormState> {
  const user = await requireUser();
  const game = await db.game.findFirst({ where: { id: str(f, "gameId"), ownerId: user.id } });
  if (!game) return { error: "Game not found." };
  const url = str(f, "trailerUrl");
  const own = (u: string | null | undefined): u is string => !!process.env.BLOB_READ_WRITE_TOKEN && isOwnUpload(u, game.id);
  const drop = async (u: string | null | undefined) => {
    if (own(u)) await del(u).catch(() => {});
  };
  const done = (msg: FormState) => {
    revalidatePath(`/dashboard/games/${game.id}`);
    revalidatePath("/");
    return msg;
  };

  if (!url) {
    await db.game.update({
      where: { id: game.id },
      data: { trailerUrl: null, pendingTrailerUrl: null, trailerStatus: null, trailerNote: null, trailerCheckedAt: null },
    });
    await drop(game.trailerUrl);
    await drop(game.pendingTrailerUrl);
    return done({ ok: "Trailer removed." });
  }
  if (!parseTrailer(url))
    return { error: "Use a YouTube link (youtube.com/watch, youtu.be or Shorts) or a direct https link to an .mp4, .webm or .mov file." };
  if (url === game.trailerUrl) return { ok: "That trailer is already live." };
  // Every check costs money (AI), so cap how often one account can try.
  if (!(await rateLimit(`trailer:${user.id}`, 12, 864e5))) {
    await drop(url);
    return { error: "You've tried a lot of trailers today. Try again tomorrow." };
  }

  const v = await checkTrailer(url);
  // A newer try replaces whatever was waiting before.
  if (game.pendingTrailerUrl && game.pendingTrailerUrl !== url) await drop(game.pendingTrailerUrl);

  if (v.decision === "approve") {
    await db.game.update({
      where: { id: game.id },
      data: { trailerUrl: url, pendingTrailerUrl: null, trailerStatus: null, trailerNote: null, trailerCheckedAt: new Date() },
    });
    if (game.trailerUrl !== url) await drop(game.trailerUrl);
    return done({ ok: "Trailer approved. It now plays on the homepage." });
  }
  if (v.decision === "review") {
    await db.game.update({
      where: { id: game.id },
      data: { pendingTrailerUrl: url, trailerStatus: "REVIEW", trailerNote: v.adminNote ?? null },
    });
    return done({ ok: v.reason });
  }
  await db.game.update({ where: { id: game.id }, data: { pendingTrailerUrl: null, trailerStatus: "REJECTED", trailerNote: v.reason } });
  await drop(url);
  return done({ error: v.reason });
}

// ---------- admin: trailer review ----------

export async function adminDecideTrailer(f: FormData) {
  await requireAdmin();
  const game = await db.game.findUnique({ where: { id: str(f, "gameId") } });
  if (!game?.pendingTrailerUrl) return;
  const own = (u: string | null) => !!u && !!process.env.BLOB_READ_WRITE_TOKEN && isOwnUpload(u, game.id);
  if (str(f, "decision") === "approve") {
    await db.game.update({
      where: { id: game.id },
      data: { trailerUrl: game.pendingTrailerUrl, pendingTrailerUrl: null, trailerStatus: null, trailerNote: null, trailerCheckedAt: new Date() },
    });
    if (game.trailerUrl && game.trailerUrl !== game.pendingTrailerUrl && own(game.trailerUrl)) await del(game.trailerUrl).catch(() => {});
  } else {
    const reason = str(f, "reason").slice(0, 300) || "This trailer doesn't meet our rules. Use real gameplay that's safe for kids.";
    await db.game.update({ where: { id: game.id }, data: { pendingTrailerUrl: null, trailerStatus: "REJECTED", trailerNote: reason } });
    if (own(game.pendingTrailerUrl)) await del(game.pendingTrailerUrl).catch(() => {});
  }
  revalidatePath("/admin/trailers");
  revalidatePath("/");
}

/** Marks a game as played in the video series (badge on its page and cards), with an optional episode link. */
export async function adminSetSeries(f: FormData) {
  await requireAdmin();
  const id = str(f, "gameId");
  if (str(f, "action") === "remove") {
    await db.game.update({ where: { id }, data: { seriesTestedAt: null, seriesVideoUrl: null } });
  } else {
    const raw = str(f, "videoUrl").slice(0, 500);
    let url: string | null = null;
    try {
      const u = new URL(raw);
      if (u.protocol === "https:") url = u.toString();
    } catch {}
    const game = await db.game.findUnique({ where: { id }, select: { seriesTestedAt: true } });
    if (!game) return;
    await db.game.update({ where: { id }, data: { seriesTestedAt: game.seriesTestedAt ?? new Date(), seriesVideoUrl: url } });
  }
  revalidatePath("/admin/series");
  revalidatePath(`/games/${id}`);
  revalidatePath("/");
}

/** Runs the check on trailers uploaded before checks existed, a few at a time. Anything not approved is hidden until an admin decides. */
export async function adminCheckOldTrailers() {
  await requireAdmin();
  const games = await db.game.findMany({
    where: { trailerUrl: { not: null }, trailerCheckedAt: null },
    select: { id: true, trailerUrl: true },
    take: 4,
  });
  for (const g of games) {
    const v = await checkTrailer(g.trailerUrl!);
    if (v.decision === "approve") await db.game.update({ where: { id: g.id }, data: { trailerCheckedAt: new Date() } });
    else
      await db.game.update({
        where: { id: g.id },
        data: {
          trailerUrl: null,
          pendingTrailerUrl: g.trailerUrl,
          trailerStatus: "REVIEW",
          trailerNote: `${v.decision === "reject" ? "Would reject" : "Unsure"}: ${v.adminNote ?? v.reason}`,
        },
      });
  }
  revalidatePath("/admin/trailers");
  revalidatePath("/");
}

// ---------- playing (earning side) ----------

export async function playGame(f: FormData) {
  const user = await requireUser();
  const r = await startTask(user.id, str(f, "gameId"));
  if ("error" in r) redirect(`/play?error=${encodeURIComponent(r.error ?? "")}`);
  redirect(`/play/tasks?started=${r.placeId}`);
}

export async function submitFeedback(_: FormState, f: FormData): Promise<FormState> {
  const user = await requireUser();
  const rating = parseInt(str(f, "rating"), 10);
  const feedback = str(f, "feedback");
  if (!(rating >= 1 && rating <= 5)) return { error: "Pick a rating from 1 to 5." };
  if (feedback.length < MIN_FEEDBACK_CHARS)
    return { error: `Write at least ${MIN_FEEDBACK_CHARS} characters. Devs use this to improve their game.` };
  const ok = await completeTask(user.id, str(f, "taskId"), rating, feedback.slice(0, 2000));
  if (!ok) return { error: "This game isn't ready for feedback yet." };
  revalidatePath("/play/tasks");
  return { ok: "+1 credit earned!" };
}

// ---------- community ----------

export async function toggleLike(f: FormData) {
  const user = await getUser();
  const gameId = str(f, "gameId");
  if (!user) redirect("/login");
  if (!(await db.game.findFirst({ where: { id: gameId, hiddenAt: null }, select: { id: true } }))) return;
  await db.$transaction(async (tx) => {
    const removed = await tx.like.deleteMany({ where: { userId: user.id, gameId } });
    if (removed.count) {
      await tx.game.update({ where: { id: gameId }, data: { likeCount: { decrement: 1 } } });
    } else {
      await tx.like.create({ data: { userId: user.id, gameId } });
      await tx.game.update({ where: { id: gameId }, data: { likeCount: { increment: 1 } } });
    }
  });
  revalidatePath(`/games/${gameId}`);
  revalidatePath("/");
}

export async function addComment(_: FormState, f: FormData): Promise<FormState> {
  const user = await getUser();
  if (!user) return { error: "Log in to comment." };
  const gameId = str(f, "gameId");
  const body = str(f, "body").replace(/\s+\n/g, "\n").slice(0, COMMENT_MAX_CHARS + 1);
  if (body.length < 2) return { error: "Write a little more." };
  if (body.length > COMMENT_MAX_CHARS) return { error: `Keep it under ${COMMENT_MAX_CHARS} characters.` };
  if (!(await db.game.findFirst({ where: { id: gameId, hiddenAt: null }, select: { id: true } }))) return { error: "Game not found." };
  const last = await db.comment.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  if (last && Date.now() - last.createdAt.getTime() < COMMENT_COOLDOWN_MS) return { error: "Slow down a little, then try again." };
  await db.comment.create({ data: { gameId, userId: user.id, body } });
  revalidatePath(`/games/${gameId}`);
  return { ok: "Posted" };
}

/** The comment's author or the game's developer can remove a comment. */
export async function deleteComment(f: FormData) {
  const user = await requireUser();
  const c = await db.comment.findUnique({ where: { id: str(f, "id") }, include: { game: { select: { ownerId: true } } } });
  if (!c || (c.userId !== user.id && c.game.ownerId !== user.id)) return;
  await db.comment.delete({ where: { id: c.id } });
  revalidatePath(`/games/${c.gameId}`);
}

export async function toggleCommentLike(f: FormData) {
  const user = await getUser();
  const c = await db.comment.findUnique({ where: { id: str(f, "id") }, select: { id: true, gameId: true, userId: true } });
  if (!c) return;
  if (!user) redirect("/login");
  if (c.userId === user.id) return; // no liking your own comment
  await db.$transaction(async (tx) => {
    const removed = await tx.commentLike.deleteMany({ where: { userId: user.id, commentId: c.id } });
    if (removed.count) await tx.comment.update({ where: { id: c.id }, data: { likeCount: { decrement: 1 } } });
    else {
      await tx.commentLike.create({ data: { userId: user.id, commentId: c.id } });
      await tx.comment.update({ where: { id: c.id }, data: { likeCount: { increment: 1 } } });
    }
  });
  revalidatePath(`/games/${c.gameId}`);
}
