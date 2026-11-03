"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { createSession, hashPassword, requireUser, verifyPassword } from "@/lib/auth";
import { fetchRobloxGame, parsePlaceId } from "@/lib/roblox";
import { MIN_BID_CENTS, MIN_DAILY_BUDGET_CENTS } from "@/lib/money";

export type FormState = { error?: string } | undefined;

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const dollarsToCents = (v: string) => Math.round(parseFloat(v.replace(",", ".")) * 100);

export async function signup(_: FormState, f: FormData): Promise<FormState> {
  const email = str(f, "email").toLowerCase();
  const password = str(f, "password");
  const displayName = str(f, "displayName") || email.split("@")[0];
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Enter a valid email." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (await db.user.findUnique({ where: { email } })) return { error: "That email is already registered." };
  const user = await db.user.create({
    data: { email, displayName, passwordHash: await hashPassword(password) },
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

export async function addGame(_: FormState, f: FormData): Promise<FormState> {
  const user = await requireUser();
  const placeId = parsePlaceId(str(f, "placeUrl"));
  if (!placeId) return { error: "Paste a Roblox game link like https://www.roblox.com/games/123456789/My-Game" };
  if (await db.game.findUnique({ where: { ownerId_placeId: { ownerId: user.id, placeId } } }))
    return { error: "You already added this game." };

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
  redirect(`/dashboard/campaigns/new?gameId=${game.id}`);
}

export async function createCampaign(_: FormState, f: FormData): Promise<FormState> {
  const user = await requireUser();
  const game = await db.game.findFirst({ where: { id: str(f, "gameId"), ownerId: user.id } });
  if (!game) return { error: "Pick one of your games." };
  const bidCents = dollarsToCents(str(f, "bid"));
  const dailyBudgetCents = dollarsToCents(str(f, "dailyBudget"));
  if (!(bidCents >= MIN_BID_CENTS)) return { error: "Minimum bid is $0.02 per click." };
  if (!(dailyBudgetCents >= MIN_DAILY_BUDGET_CENTS)) return { error: "Minimum daily budget is $1." };
  if (dailyBudgetCents < bidCents) return { error: "Daily budget must be at least one click." };
  await db.campaign.create({ data: { gameId: game.id, bidCents, dailyBudgetCents } });
  redirect("/dashboard");
}

export async function toggleCampaign(f: FormData) {
  const user = await requireUser();
  const c = await db.campaign.findFirst({
    where: { id: str(f, "id"), game: { ownerId: user.id } },
  });
  if (!c) return;
  await db.campaign.update({
    where: { id: c.id },
    data: { status: c.status === "ACTIVE" ? "PAUSED" : "ACTIVE" },
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
  revalidatePath("/dashboard");
}
