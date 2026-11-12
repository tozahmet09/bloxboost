import "server-only";
import { randomBytes } from "crypto";
import { db } from "./db";

/** The user's invite code, created the first time it's needed. */
export async function ensureReferralCode(userId: string) {
  const u = await db.user.findUnique({ where: { id: userId }, select: { referralCode: true } });
  if (u?.referralCode) return u.referralCode;
  for (let i = 0; i < 5; i++) {
    const code = randomBytes(4).toString("base64url").replace(/[-_]/g, "x").slice(0, 6).toLowerCase();
    if (await db.user.findFirst({ where: { referralCode: code }, select: { id: true } })) continue;
    await db.user.update({ where: { id: userId }, data: { referralCode: code } });
    return code;
  }
  throw new Error("could not create invite code");
}

const since = (days: number) => new Date(Date.now() - days * 864e5);

/** Most liked games, overall or in the last N days. */
export async function topGames(take = 20, days?: number) {
  if (!days) {
    return db.game.findMany({ where: { likeCount: { gt: 0 }, hiddenAt: null }, orderBy: [{ likeCount: "desc" }, { createdAt: "asc" }], take });
  }
  const rows = await db.like.groupBy({
    by: ["gameId"],
    where: { createdAt: { gte: since(days) }, game: { hiddenAt: null } },
    _count: { gameId: true },
    orderBy: { _count: { gameId: "desc" } },
    take,
  });
  const games = await db.game.findMany({ where: { id: { in: rows.map((r) => r.gameId) } } });
  const byId = new Map(games.map((g) => [g.id, g]));
  return rows.map((r) => ({ ...byId.get(r.gameId)!, recentLikes: r._count.gameId })).filter((g) => g.id);
}

const userSelect = { id: true, displayName: true, robloxUsername: true, robloxVerified: true, robloxUserId: true } as const;

/** Developers ranked by the minutes testers spent in their games (likes break ties). */
export async function topDevs(take = 20) {
  const rows = await db.playTask.groupBy({
    by: ["gameId"],
    where: { playedSeconds: { gt: 0 }, game: { hiddenAt: null } },
    _sum: { playedSeconds: true },
  });
  const games = await db.game.findMany({
    where: { hiddenAt: null },
    select: { id: true, ownerId: true, likeCount: true },
  });
  const secs = new Map(rows.map((r) => [r.gameId, r._sum.playedSeconds ?? 0]));
  const byOwner = new Map<string, { seconds: number; likes: number; games: number }>();
  for (const g of games) {
    const o = byOwner.get(g.ownerId) ?? { seconds: 0, likes: 0, games: 0 };
    o.seconds += secs.get(g.id) ?? 0;
    o.likes += g.likeCount;
    o.games += 1;
    byOwner.set(g.ownerId, o);
  }
  const ranked = [...byOwner.entries()]
    .filter(([, s]) => s.seconds >= 60 || s.likes > 0)
    .sort((a, b) => b[1].seconds - a[1].seconds || b[1].likes - a[1].likes)
    .slice(0, take);
  const users = await db.user.findMany({ where: { id: { in: ranked.map(([id]) => id) } }, select: userSelect });
  const byId = new Map(users.map((u) => [u.id, u]));
  return ranked
    .map(([id, s]) => ({ user: byId.get(id)!, minutes: Math.floor(s.seconds / 60), likes: s.likes, games: s.games }))
    .filter((r) => r.user);
}

/** Testers ranked by the minutes they spent playing other devs' games (finished plays break ties). */
export async function topTesters(take = 20) {
  const [timeRows, doneRows] = await Promise.all([
    db.playTask.groupBy({ by: ["playerId"], where: { playedSeconds: { gt: 0 } }, _sum: { playedSeconds: true } }),
    db.playTask.groupBy({ by: ["playerId"], where: { status: "COMPLETED" }, _count: { id: true } }),
  ]);
  const done = new Map(doneRows.map((r) => [r.playerId, r._count.id]));
  const ranked = timeRows
    .map((r) => ({ id: r.playerId, seconds: r._sum.playedSeconds ?? 0, plays: done.get(r.playerId) ?? 0 }))
    .filter((r) => r.seconds >= 60)
    .sort((a, b) => b.seconds - a.seconds || b.plays - a.plays)
    .slice(0, take);
  const users = await db.user.findMany({ where: { id: { in: ranked.map((r) => r.id) } }, select: userSelect });
  const byId = new Map(users.map((u) => [u.id, u]));
  return ranked.map((r) => ({ user: byId.get(r.id)!, minutes: Math.floor(r.seconds / 60), plays: r.plays })).filter((r) => r.user);
}

/** Public name: the verified Roblox name if linked, otherwise the display name. */
export function publicName(u: { displayName: string; robloxUsername: string | null; robloxVerified: boolean }) {
  return u.robloxVerified && u.robloxUsername ? u.robloxUsername : u.displayName;
}
