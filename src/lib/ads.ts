import "server-only";
import { createHash } from "crypto";
import { db } from "./db";
import { today } from "./money";

/**
 * Picks the sponsored games to show on the discovery page.
 * Eligible = ACTIVE campaign, owner can afford one click, today's spend < daily budget.
 * Ranked by bid with a little randomness so lower bidders still get some exposure.
 */
export async function pickSponsored(limit = 6) {
  const day = today();
  const campaigns = await db.campaign.findMany({
    where: { status: "ACTIVE" },
    include: {
      game: { include: { owner: { select: { creditCents: true } } } },
      stats: { where: { day } },
    },
  });

  const eligible = campaigns.filter((c) => {
    const spent = c.stats[0]?.spendCents ?? 0;
    return c.game.owner.creditCents >= c.bidCents && spent + c.bidCents <= c.dailyBudgetCents;
  });

  // One slot per game: keep its highest bid campaign.
  const byGame = new Map<string, (typeof eligible)[number]>();
  for (const c of eligible) {
    const cur = byGame.get(c.gameId);
    if (!cur || c.bidCents > cur.bidCents) byGame.set(c.gameId, c);
  }

  const ranked = [...byGame.values()]
    .map((c) => ({ c, score: c.bidCents * (0.75 + Math.random() * 0.5) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.c);

  if (ranked.length) {
    await db.$transaction(
      ranked.map((c) =>
        db.campaignStat.upsert({
          where: { campaignId_day: { campaignId: c.id, day } },
          create: { campaignId: c.id, day, impressions: 1 },
          update: { impressions: { increment: 1 } },
        }),
      ),
    );
  }
  return ranked;
}

export function visitorHash(ip: string, ua: string) {
  const salt = process.env.VISITOR_SALT ?? "dev";
  return createHash("sha256").update(`${salt}|${ip}|${ua}|${today()}`).digest("hex").slice(0, 32);
}

/**
 * Records a click. Charges the advertiser only for the first click
 * from a given visitor per campaign per day, and only within budget.
 */
export async function recordClick(gameId: string, campaignId: string | null, vh: string) {
  const day = today();
  return db.$transaction(async (tx) => {
    let cost = 0;
    if (campaignId) {
      const c = await tx.campaign.findUnique({
        where: { id: campaignId },
        include: { game: { include: { owner: true } }, stats: { where: { day } } },
      });
      if (c && c.gameId === gameId) {
        const dupe = await tx.click.findFirst({ where: { campaignId, visitorHash: vh, day } });
        const spent = c.stats[0]?.spendCents ?? 0;
        const canCharge =
          !dupe &&
          c.status === "ACTIVE" &&
          c.game.owner.creditCents >= c.bidCents &&
          spent + c.bidCents <= c.dailyBudgetCents;
        if (canCharge) {
          cost = c.bidCents;
          await tx.user.update({
            where: { id: c.game.ownerId },
            data: { creditCents: { decrement: cost } },
          });
        }
        await tx.campaignStat.upsert({
          where: { campaignId_day: { campaignId, day } },
          create: { campaignId, day, clicks: dupe ? 0 : 1, spendCents: cost },
          update: { clicks: { increment: dupe ? 0 : 1 }, spendCents: { increment: cost } },
        });
      } else {
        campaignId = null;
      }
    }
    await tx.click.create({ data: { gameId, campaignId, visitorHash: vh, day, costCents: cost } });
    return cost;
  });
}
