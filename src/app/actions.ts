"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { createSession, hashPassword, requireUser, verifyPassword } from "@/lib/auth";
import { fetchRobloxGame, lookupRobloxUser, parsePlaceId, robloxProfileDescription } from "@/lib/roblox";
import { completeTask, startTask } from "@/lib/credits";
import { parseTrailer } from "@/lib/trailer";
import { EARLY_BIRD_ACCOUNTS, EARLY_BIRD_CREDITS, MIN_FEEDBACK_CHARS } from "@/lib/money";

export type FormState = { error?: string; ok?: string } | undefined;

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

// ---------- accounts ----------

export async function signup(_: FormState, f: FormData): Promise<FormState> {
  const email = str(f, "email").toLowerCase();
  const password = str(f, "password");
  const displayName = str(f, "displayName") || email.split("@")[0];
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Enter a valid email." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (f.get("agree") !== "on") return { error: "Please confirm you're 13 or older and accept the Terms." };
  if (await db.user.findUnique({ where: { email } })) return { error: "That email is already registered." };
  const passwordHash = await hashPassword(password);
  const user = await db.$transaction(async (tx) => {
    const early = (await tx.user.count()) < EARLY_BIRD_ACCOUNTS;
    return tx.user.create({ data: { email, displayName, passwordHash, credits: early ? EARLY_BIRD_CREDITS : 0 } });
  });
  await createSession(user.id);
  redirect("/dashboard");
}

export async function login(_: FormState, f: FormData): Promise<FormState> {
  const email = str(f, "email").toLowerCase();
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(str(f, "password"), user.passwordHash)))
    return { error: "Wrong email or password." };
  await createSession(user.id);
  redirect("/dashboard");
}

// ---------- Roblox account linking ----------

export async function startRobloxLink(_: FormState, f: FormData): Promise<FormState> {
  const user = await requireUser();
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
      robloxVerifyCode: `bloxboost-${randomBytes(3).toString("hex")}`,
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
  if (!skip) {
    let about = "";
    try {
      about = await robloxProfileDescription(id);
    } catch {
      return { error: "Couldn't reach Roblox. Try again in a minute." };
    }
    if (!about.includes(user.robloxVerifyCode))
      return { error: `We didn't find ${user.robloxVerifyCode} in your Roblox profile "About". Save it there and try again (it can take a minute to update).` };
  }
  await db.$transaction([
    // release the id from any unverified holder
    db.user.updateMany({ where: { robloxUserId: id, NOT: { id: user.id } }, data: { robloxUserId: null } }),
    db.user.update({
      where: { id: user.id },
      data: { robloxUserId: id, robloxUsername: name, robloxVerified: true, robloxVerifyCode: null },
    }),
  ]);
  redirect("/play");
}

// ---------- games & campaigns (developer side) ----------

export async function addGame(_: FormState, f: FormData): Promise<FormState> {
  const user = await requireUser();
  const placeId = parsePlaceId(str(f, "placeUrl"));
  if (!placeId) return { error: "Paste a Roblox game link like https://www.roblox.com/games/123456789/My-Game" };

  const existing = await db.game.findUnique({ where: { placeId } });
  if (existing) {
    if (existing.ownerId === user.id) redirect(`/dashboard/games/${existing.id}`);
    // Someone claimed it but never installed the script: let the real owner take it after a day.
    const stale = !existing.scriptLastSeen && existing.createdAt < new Date(Date.now() - 864e5);
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
  const n = parseInt(str(f, "players"), 10);
  if (!(n >= 1 && n <= 10000)) return { error: "Choose between 1 and 10,000 players." };
  const ok = await db.$transaction(async (tx) => {
    const u = await tx.user.findUnique({ where: { id: user.id } });
    if (!u || u.credits < n) return false;
    await tx.user.update({ where: { id: user.id }, data: { credits: { decrement: n } } });
    await tx.campaign.create({ data: { gameId: game.id, targetPlayers: n } });
    return true;
  });
  if (!ok) return { error: `You need ${n} credits. Play other games to earn them, or buy a pack.` };
  redirect(`/dashboard/games/${game.id}`);
}

export async function toggleCampaign(f: FormData) {
  const user = await requireUser();
  const c = await db.campaign.findFirst({ where: { id: str(f, "id"), game: { ownerId: user.id } } });
  if (!c || !["ACTIVE", "PAUSED"].includes(c.status)) return;
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
    await tx.campaign.update({
      where: { id: c.id },
      data: { status: "CANCELLED", targetPlayers: c.delivered + open },
    });
    await tx.user.update({ where: { id: user.id }, data: { credits: { increment: refund } } });
  });
  revalidatePath("/dashboard");
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

export async function setTrailer(_: FormState, f: FormData): Promise<FormState> {
  const user = await requireUser();
  const game = await db.game.findFirst({ where: { id: str(f, "gameId"), ownerId: user.id } });
  if (!game) return { error: "Game not found." };
  const url = str(f, "trailerUrl");
  if (url && !parseTrailer(url))
    return { error: "Use a YouTube link (youtube.com/watch, youtu.be or Shorts) or a direct https link to an .mp4 or .webm file." };
  await db.game.update({ where: { id: game.id }, data: { trailerUrl: url || null } });
  revalidatePath(`/dashboard/games/${game.id}`);
  return { ok: url ? "Trailer saved. It now plays on the homepage." : "Trailer removed." };
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
