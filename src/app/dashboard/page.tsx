import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { SCRIPT_ALIVE_MS } from "@/lib/money";
import { GameIcon } from "@/components/GameCard";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const user = await requireUser();
  const games = await db.game.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "desc" },
    include: { campaigns: { where: { status: { in: ["ACTIVE", "PAUSED"] } } }, _count: { select: { tasks: { where: { status: "COMPLETED" } } } } },
  });
  const alive = Date.now() - SCRIPT_ALIVE_MS;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="text-2xl font-bold">Hi, {user.displayName}</h1>
        <div className="card ml-auto flex items-center gap-4 px-4 py-3">
          <div>
            <div className="text-xs text-slate-400">Credits (1 = 1 player)</div>
            <div className="text-xl font-bold">⭐ {user.credits}</div>
          </div>
          <Link href="/play" className="btn-ghost">Earn</Link>
          <Link href="/dashboard/billing" className="btn">Buy</Link>
        </div>
      </div>

      {!user.robloxVerified && (
        <p className="rounded-xl bg-amber-500/10 p-3 text-sm text-amber-300">
          Want free credits? <Link href="/dashboard/roblox" className="underline">Link your Roblox account</Link> and play other devs&apos; games.
        </p>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Your games</h2>
        <Link href="/dashboard/games/new" className="btn-ghost">+ Add game</Link>
      </div>

      {games.length === 0 && (
        <div className="card p-8 text-center text-slate-400">
          Add your first game by pasting its Roblox link.
          <div><Link href="/dashboard/games/new" className="btn mt-4">Add game</Link></div>
        </div>
      )}

      {games.map((g) => {
        const live = g.scriptLastSeen && g.scriptLastSeen.getTime() > alive;
        const active = g.campaigns.reduce((a, c) => a + c.targetPlayers - c.delivered, 0);
        return (
          <Link key={g.id} href={`/dashboard/games/${g.id}`} className="card flex items-center gap-4 p-4 hover:border-brand">
            <GameIcon url={g.iconUrl} className="h-14 w-14 rounded-xl" />
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{g.name}</div>
              <div className="text-xs text-slate-400">
                {g._count.tasks} verified players · {active} still coming
                {g.featuredUntil && g.featuredUntil > new Date() && " · 🔥 Featured"}
              </div>
            </div>
            <span className={`text-xs ${live ? "text-brand" : "text-amber-300"}`}>
              {live ? "● Tracker live" : "⚠ Install tracker"}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
