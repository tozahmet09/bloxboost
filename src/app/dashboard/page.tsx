import Link from "next/link";
import { ChevronRight, Plus, Radio, Link2 } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { SCRIPT_ALIVE_MS } from "@/lib/money";
import { GameIcon } from "@/components/GameIcon";
import { GoalBar } from "@/components/GoalBar";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
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

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">My games</p>
          <h1 className="mt-1 text-3xl font-extrabold">Hi, {user.displayName}</h1>
        </div>
        <Link href="/dashboard/games/new" className="btn"><Plus className="h-4 w-4" /> Add game</Link>
      </div>

      {!user.robloxVerified && (
        <Link href="/dashboard/roblox" className="flex items-center gap-3 rounded-ctl border border-line px-4 py-3 text-sm hover:border-mute">
          <Link2 className="h-4 w-4 text-marquee" />
          <span className="flex-1">Link your Roblox account to earn free credits by playing.</span>
          <ChevronRight className="h-4 w-4 text-mute" />
        </Link>
      )}

      {games.length === 0 ? (
        <div className="rounded-media border border-dashed border-line px-6 py-14 text-center">
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
                      <span className="truncate font-semibold group-hover:text-marquee">{g.name}</span>
                      <span className={`chip ${live ? "bg-verified/10 text-verified" : "bg-marquee/10 text-marquee"}`}>
                        <Radio className="h-3 w-3" /> {live ? "Tracker live" : "Install tracker"}
                      </span>
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
    </div>
  );
}
