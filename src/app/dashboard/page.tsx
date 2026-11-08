import Link from "next/link";
import { headers } from "next/headers";
import { BadgeCheck, ChevronRight, Gift, Plus, Link2 } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { REFERRAL_CREDITS, SCRIPT_ALIVE_MS } from "@/lib/money";
import { ensureReferralCode } from "@/lib/community";
import { CopyButton } from "@/components/CopyButton";
import { GameIcon } from "@/components/GameIcon";
import { GoalBar } from "@/components/GoalBar";

export const dynamic = "force-dynamic";

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ reset?: string }> }) {
  const { reset } = await searchParams;
  const user = await requireUser();
  const games = await db.game.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      campaigns: { where: { status: { in: ["ACTIVE", "PAUSED"] } } },
      _count: { select: { tasks: { where: { status: "COMPLETED" } } } },
    },
  });
  const alive = Date.now() - SCRIPT_ALIVE_MS;
  const code = await ensureReferralCode(user.id);
  const h = await headers();
  const appUrl = process.env.APP_URL || `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  const invite = `${appUrl.replace(/\/$/, "")}/signup?ref=${code}`;
  const toReview = isAdminEmail(user.email) ? await db.game.count({ where: { trailerStatus: "REVIEW" } }) : null;
  const [invited, invitedPaid] = await Promise.all([
    db.user.count({ where: { referredById: user.id } }),
    db.user.count({ where: { referredById: user.id, referralPaid: true } }),
  ]);

  return (
    <div className="space-y-8">
      {reset && <p role="status" className="notice">Your password was changed. Any other devices were logged out.</p>}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">My games</p>
          <h1 className="mt-1 page-title">Hi, {user.displayName}</h1>
        </div>
        <Link href="/dashboard/games/new" className="btn"><Plus className="h-4 w-4" /> Add game</Link>
      </div>

      {!user.robloxVerified && (
        <Link href="/dashboard/roblox" className="flex items-center gap-3 rounded-ctl border border-line px-4 py-3 text-sm hover:border-mute">
          <Link2 className="h-4 w-4 text-coral" />
          <span className="flex-1">Link your Roblox account to earn free credits by playing.</span>
          <ChevronRight className="h-4 w-4 text-mute" />
        </Link>
      )}

      {toReview !== null && (
        <Link href="/admin/trailers" className="flex items-center gap-3 rounded-ctl border border-line px-4 py-3 text-sm hover:border-mute">
          <span className="flex-1">Trailer review: {toReview === 0 ? "nothing waiting" : `${toReview} waiting`}</span>
          <ChevronRight className="h-4 w-4 text-mute" />
        </Link>
      )}

      {games.length === 0 ? (
        <div className="py-14 text-center">
          <p className="text-mute">Paste your game&apos;s Roblox link to start.</p>
          <Link href="/dashboard/games/new" className="btn mt-4"><Plus className="h-4 w-4" /> Add game</Link>
        </div>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {games.map((g) => {
            const live = !!g.scriptLastSeen && g.scriptLastSeen.getTime() > alive;
            const coming = g.campaigns.reduce((a, c) => a + c.targetPlayers - c.delivered, 0);
            return (
              <li key={g.id}>
                <Link href={`/dashboard/games/${g.id}`} className="group flex items-center gap-4 py-4">
                  <GameIcon url={g.iconUrl} className="h-14 w-14 shrink-0 rounded-ctl" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-semibold group-hover:text-coral">{g.name}</span>
                      {live && (
                        <span className="inline-flex items-center gap-1 text-xs text-cream">
                          <BadgeCheck className="h-3 w-3" /> Verified
                        </span>
                      )}
                      {coming > 0 && <span className="text-xs text-mute">{coming} on the way</span>}
                    </div>
                    <GoalBar count={g._count.tasks} compact />
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-mute group-hover:text-cream" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <section className="rule space-y-3 pt-8">
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-coral" />
          <h2 className="text-lg font-bold">Invite a dev friend</h2>
        </div>
        <p className="max-w-prose text-sm text-mute">
          They start with +{REFERRAL_CREDITS} credits. You get +{REFERRAL_CREDITS} when they finish their first verified play.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <code className="input flex min-w-0 flex-1 items-center truncate text-sm text-cream sm:max-w-md">{invite}</code>
          <CopyButton text={invite} label="Copy link" />
        </div>
        {invited > 0 && <p className="text-sm text-mute tabular-nums">{invited} joined, {invitedPaid} paid out.</p>}
      </section>

      <p className="text-sm">
        <Link href="/dashboard/account" className="text-mute underline hover:text-cream">Account settings</Link>
      </p>
    </div>
  );
}
