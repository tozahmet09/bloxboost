import "server-only";
import { randomBytes } from "crypto";
import { db } from "./db";
import { PLAYS_TO_POST } from "./money";

/**
 * How many games this user still has to play before posting their own.
 * While the site is new there may be fewer than 3 games to play, so the rule only asks for what exists.
 */
export async function postingRequirement(userId: string) {
  const [done, ownGames, available] = await Promise.all([
    db.playTask.count({ where: { playerId: userId, status: "COMPLETED" } }),
    db.game.count({ where: { ownerId: userId } }),
    // games this user could still play right now
    db.game.count({ where: { ownerId: { not: userId }, hiddenAt: null, campaigns: { some: { status: "ACTIVE" } }, tasks: { none: { playerId: userId } } } }),
  ]);
  const needed = Math.min(PLAYS_TO_POST, done + available);
  return { done, needed, left: Math.max(0, needed - done), hasGames: ownGames > 0 };
}

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

/** Developers ranked by the likes all their games got. */
export async function topDevs(take = 20) {
  const rows = await db.game.groupBy({
    by: ["ownerId"],
    where: { hiddenAt: null },
    _sum: { likeCount: true },
    _count: { id: true },
    orderBy: { _sum: { likeCount: "desc" } },
    take,
  });
  const users = await db.user.findMany({ where: { id: { in: rows.map((r) => r.ownerId) } }, select: { id: true, displayName: true, robloxUsername: true, robloxVerified: true } });
  const byId = new Map(users.map((u) => [u.id, u]));
  return rows
    .filter((r) => (r._sum.likeCount ?? 0) > 0)
    .map((r) => ({ user: byId.get(r.ownerId)!, likes: r._sum.likeCount ?? 0, games: r._count.id }));
}

/** Players ranked by likes on their comments, then by games they played and reviewed. */
export async function topPlayers(take = 20) {
  const [likeRows, playRows] = await Promise.all([
    db.comment.groupBy({ by: ["userId"], _sum: { likeCount: true }, orderBy: { _sum: { likeCount: "desc" } }, take: 100 }),
    db.playTask.groupBy({ by: ["playerId"], where: { status: "COMPLETED" }, _count: { id: true }, orderBy: { _count: { id: "desc" } }, take: 100 }),
  ]);
  const score = new Map<string, { likes: number; plays: number }>();
  for (const r of likeRows) score.set(r.userId, { likes: r._sum.likeCount ?? 0, plays: 0 });
  for (const r of playRows) score.set(r.playerId, { likes: score.get(r.playerId)?.likes ?? 0, plays: r._count.id });
  const ranked = [...score.entries()]
    .filter(([, s]) => s.likes > 0 || s.plays > 0)
    .sort((a, b) => b[1].likes - a[1].likes || b[1].plays - a[1].plays)
    .slice(0, take);
  const users = await db.user.findMany({ where: { id: { in: ranked.map(([id]) => id) } }, select: { id: true, displayName: true, robloxUsername: true, robloxVerified: true } });
  const byId = new Map(users.map((u) => [u.id, u]));
  return ranked.map(([id, s]) => ({ user: byId.get(id)!, ...s })).filter((r) => r.user);
}

/** Public name: the verified Roblox name if linked, otherwise the display name. */
export function publicName(u: { displayName: string; robloxUsername: string | null; robloxVerified: boolean }) {
  return u.robloxVerified && u.robloxUsername ? u.robloxUsername : u.displayName;
}
