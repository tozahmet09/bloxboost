import "server-only";
import { createHash } from "crypto";
import { db } from "./db";
import { MAX_OPEN_TASKS, REQUIRED_SECONDS, SCRIPT_ALIVE_MS, TASK_TTL_HOURS, today } from "./money";

const aliveSince = () => new Date(Date.now() - SCRIPT_ALIVE_MS);

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
        scriptLastSeen: { gte: aliveSince() },
        tasks: { none: { playerId } },
      },
    },
    include: { game: true, _count: { select: { tasks: { where: { status: { in: ["PENDING", "PLAYED"] } } } } } },
    orderBy: { createdAt: "asc" },
  });
  const seen = new Set<string>();
  return campaigns.filter((c) => {
    if (seen.has(c.gameId)) return false;
    const free = c.targetPlayers - c.delivered - c._count.tasks;
    if (free <= 0) return false;
    seen.add(c.gameId);
    return true;
  });
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
  if (!robloxUserIds.length) return { updated: 0 };

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
      data: { playedSeconds: played, lastPingAt: now, status: played >= REQUIRED_SECONDS ? "PLAYED" : "PENDING" },
    });
    updated++;
  }
  return { updated };
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
    await tx.user.update({ where: { id: playerId }, data: { credits: { increment: 1 } } });
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
