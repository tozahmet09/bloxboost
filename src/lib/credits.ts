import "server-only";
import { createHash } from "crypto";
import { db } from "./db";
import { fetchPresence } from "./roblox";
import { MAX_OPEN_TASKS, REFERRAL_CREDITS, REQUIRED_SECONDS, SCRIPT_ALIVE_MS, TASK_TTL_HOURS, today } from "./money";

const aliveSince = () => new Date(Date.now() - SCRIPT_ALIVE_MS);

/** A game has the "Verified" badge while its tracker script is pinging us. */
export function isVerifiedGame(g: { scriptLastSeen: Date | null }) {
  return !!g.scriptLastSeen && g.scriptLastSeen.getTime() > Date.now() - SCRIPT_ALIVE_MS;
}

/** Expire tasks that never reached the playtime, and give their slot back to the campaign. */
export async function expireStaleTasks() {
  const cutoff = new Date(Date.now() - TASK_TTL_HOURS * 3600e3);
  await db.playTask.updateMany({
    where: { status: "PENDING", createdAt: { lt: cutoff } },
    data: { status: "EXPIRED" },
  });
}

/** Number of open (not yet finished) tasks that are holding a campaign slot. */
async function openTaskCount(campaignId: string) {
  return db.playTask.count({ where: { campaignId, status: { in: ["PENDING", "PLAYED"] } } });
}

/** Games this player can play right now to earn credits. */
export async function playQueue(playerId: string) {
  await expireStaleTasks();
  const campaigns = await db.campaign.findMany({
    where: {
      status: "ACTIVE",
      game: {
        ownerId: { not: playerId },
        tasks: { none: { playerId } },
      },
    },
    include: { game: true, _count: { select: { tasks: { where: { status: { in: ["PENDING", "PLAYED"] } } } } } },
    orderBy: { createdAt: "asc" },
  });
  const seen = new Set<string>();
  return campaigns
    .filter((c) => {
      if (seen.has(c.gameId)) return false;
      const free = c.targetPlayers - c.delivered - c._count.tasks;
      if (free <= 0) return false;
      seen.add(c.gameId);
      return true;
    })
    // Games with the tracker script (Verified) are shown first, as a reward for installing it.
    .sort((a, b) => Number(isVerifiedGame(b.game)) - Number(isVerifiedGame(a.game)));
}

export async function startTask(playerId: string, gameId: string) {
  const player = await db.user.findUnique({ where: { id: playerId } });
  if (!player?.robloxVerified || !player.robloxUserId) return { error: "Link your Roblox account first." };
  const open = await db.playTask.count({ where: { playerId, status: { in: ["PENDING", "PLAYED"] } } });
  if (open >= MAX_OPEN_TASKS) return { error: `Finish your open games first (max ${MAX_OPEN_TASKS} at a time).` };
  const queue = await playQueue(playerId);
  const c = queue.find((q) => q.gameId === gameId);
  if (!c) return { error: "This game doesn't need players right now." };
  if ((await openTaskCount(c.id)) + c.delivered >= c.targetPlayers) return { error: "Campaign just filled up." };
  // Presence can't tell games apart, so a player can only have one script-free game going at a time.
  if (!isVerifiedGame(c.game)) {
    const other = await db.playTask.findFirst({
      where: { playerId, status: "PENDING", game: { OR: [{ scriptLastSeen: null }, { scriptLastSeen: { lt: aliveSince() } }] } },
      include: { game: { select: { name: true } } },
    });
    if (other) return { error: `Finish ${other.game.name} first. You can only play one game without the Verified badge at a time.` };
  }
  const task = await db.playTask.create({
    data: { gameId, campaignId: c.id, playerId, robloxUserId: player.robloxUserId },
  });
  return { task, placeId: c.game.placeId };
}

/**
 * Heartbeat from a game's tracker script: the Roblox user ids currently in the server.
 * Adds playtime to each matching PENDING task, at most once per ~minute per task.
 */
export async function heartbeat(secret: string, robloxUserIds: string[]) {
  const game = await db.game.findUnique({ where: { secret } });
  if (!game) return null;
  const now = new Date();
  await db.game.update({ where: { id: game.id }, data: { scriptLastSeen: now } });
  // The script only reports players on this list, so it never sends ids of normal players.
  const open = await db.playTask.findMany({
    where: { gameId: game.id, status: "PENDING" },
    select: { robloxUserId: true },
    take: 500,
  });
  const watch = open.map((t) => t.robloxUserId);
  if (!robloxUserIds.length) return { updated: 0, watch };

  const tasks = await db.playTask.findMany({
    where: { gameId: game.id, status: "PENDING", robloxUserId: { in: robloxUserIds.slice(0, 200) } },
  });
  let updated = 0;
  for (const t of tasks) {
    const since = t.lastPingAt ? (now.getTime() - t.lastPingAt.getTime()) / 1000 : 60;
    if (since < 50) continue; // ignore spammy pings
    const add = Math.min(Math.round(since), 75); // don't credit gaps (player left and came back)
    const played = t.playedSeconds + add;
    await db.playTask.update({
      where: { id: t.id },
      data: { playedSeconds: played, lastPingAt: now, verifiedBy: "SCRIPT", status: played >= REQUIRED_SECONDS ? "PLAYED" : "PENDING" },
    });
    updated++;
  }
  return { updated, watch };
}

/** Minimum gap between two presence checks of the same task. */
const PRESENCE_EVERY_S = 50;

/**
 * Script-free playtime: for games without the tracker, ask Roblox whether each waiting
 * player is currently in a game, about once a minute, and add the time between two
 * "in game" answers in a row. Any "not in game" answer breaks the streak.
 * Roblox doesn't tell anonymous callers WHICH game, so this is weaker than the script
 * (hence the Verified badge for script games). If Roblox does return the universe, a
 * different game doesn't count.
 * Called from the player's "My progress" page while it's open, so it needs no cron.
 */
export async function presenceTick(limit = 50) {
  const now = new Date();
  const tasks = await db.playTask.findMany({
    where: {
      status: "PENDING",
      game: { OR: [{ scriptLastSeen: null }, { scriptLastSeen: { lt: aliveSince() } }] },
      OR: [{ presenceCheckedAt: null }, { presenceCheckedAt: { lt: new Date(now.getTime() - PRESENCE_EVERY_S * 1000) } }],
    },
    include: { game: { select: { universeId: true } } },
    orderBy: { presenceCheckedAt: { sort: "asc", nulls: "first" } },
    take: Math.min(limit, 50),
  });
  if (!tasks.length) return { checked: 0 };

  const presence = await fetchPresence([...new Set(tasks.map((t) => t.robloxUserId))]);
  let counted = 0;
  for (const t of tasks) {
    const p = presence.get(t.robloxUserId);
    const inThisGame = !!p?.inGame && (!p.universeId || !t.game.universeId || p.universeId === t.game.universeId);
    if (!inThisGame) {
      await db.playTask.update({ where: { id: t.id }, data: { presenceCheckedAt: now, lastPingAt: null } });
      continue;
    }
    // First "in game" answer starts the clock; later ones add the time since the last one.
    const since = t.lastPingAt ? (now.getTime() - t.lastPingAt.getTime()) / 1000 : 0;
    const add = Math.min(Math.round(since), 90); // a longer gap means we lost track: don't credit it
    const played = t.playedSeconds + add;
    await db.playTask.update({
      where: { id: t.id },
      data: {
        playedSeconds: played,
        lastPingAt: now,
        presenceCheckedAt: now,
        verifiedBy: t.verifiedBy ?? "PRESENCE",
        status: played >= REQUIRED_SECONDS ? "PLAYED" : "PENDING",
      },
    });
    counted++;
  }
  return { checked: tasks.length, counted };
}

/** Player leaves feedback on a played game: they earn 1 credit, the campaign delivers 1 player. */
export async function completeTask(playerId: string, taskId: string, rating: number, feedback: string) {
  return db.$transaction(async (tx) => {
    const t = await tx.playTask.findFirst({ where: { id: taskId, playerId, status: "PLAYED" }, include: { campaign: true } });
    if (!t) return false;
    await tx.playTask.update({
      where: { id: t.id },
      data: { status: "COMPLETED", rating, feedback, completedAt: new Date() },
    });
    const player = await tx.user.update({ where: { id: playerId }, data: { credits: { increment: 1 } } });
    // Invite bonus: the inviter gets paid once, when the person they invited finishes a first verified play.
    if (player.referredById && !player.referralPaid) {
      const claimed = await tx.user.updateMany({ where: { id: playerId, referralPaid: false }, data: { referralPaid: true } });
      if (claimed.count) await tx.user.update({ where: { id: player.referredById }, data: { credits: { increment: REFERRAL_CREDITS } } });
    }
    const delivered = t.campaign.delivered + 1;
    await tx.campaign.update({
      where: { id: t.campaignId },
      data: { delivered, status: delivered >= t.campaign.targetPlayers ? "DONE" : undefined },
    });
    return true;
  });
}

export function visitorHash(ip: string, ua: string) {
  const salt = process.env.VISITOR_SALT ?? "dev";
  return createHash("sha256").update(`${salt}|${ip}|${ua}|${today()}`).digest("hex").slice(0, 32);
}
