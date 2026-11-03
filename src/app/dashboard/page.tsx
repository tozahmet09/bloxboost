import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fmt, today } from "@/lib/money";
import { refreshGame, toggleCampaign } from "../actions";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const user = await requireUser();
  const day = today();
  const since = new Date(Date.now() - 6 * 864e5).toISOString().slice(0, 10);
  const games = await db.game.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      campaigns: {
        orderBy: { createdAt: "desc" },
        include: { stats: { where: { day: { gte: since } } } },
      },
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Hi, {user.displayName}</h1>
          <p className="text-sm text-slate-400">Stats below cover the last 7 days.</p>
        </div>
        <div className="card ml-auto flex items-center gap-4 px-4 py-3">
          <div>
            <div className="text-xs text-slate-400">Ad credit</div>
            <div className="text-xl font-bold">{fmt(user.creditCents)}</div>
          </div>
          <Link href="/dashboard/billing" className="btn">Add credit</Link>
        </div>
      </div>

      {user.creditCents === 0 && games.length > 0 && (
        <p className="rounded-xl bg-amber-500/10 p-3 text-sm text-amber-300">
          Your ads are not showing because your credit is $0.00. <Link href="/dashboard/billing" className="underline">Add credit</Link>.
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

      {games.map((g) => (
        <div key={g.id} className="card p-4">
          <div className="flex items-center gap-4">
            {g.iconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={g.iconUrl} alt="" className="h-14 w-14 rounded-xl" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-800">🎮</div>
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{g.name}</div>
              <div className="text-xs text-slate-400">
                {g.playing.toLocaleString()} playing · {g.visits.toLocaleString()} visits
              </div>
            </div>
            <form action={refreshGame}>
              <input type="hidden" name="id" value={g.id} />
              <button className="btn-ghost text-xs">Refresh</button>
            </form>
            <Link href={`/dashboard/campaigns/new?gameId=${g.id}`} className="btn text-sm">New campaign</Link>
          </div>

          {g.campaigns.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-slate-400">
                  <tr>
                    <th className="py-1">Status</th><th>Bid / click</th><th>Daily budget</th>
                    <th>Spent today</th><th>Views</th><th>Clicks</th><th>CTR</th><th>Spend (7d)</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {g.campaigns.map((c) => {
                    const imp = c.stats.reduce((a, s) => a + s.impressions, 0);
                    const clk = c.stats.reduce((a, s) => a + s.clicks, 0);
                    const spend = c.stats.reduce((a, s) => a + s.spendCents, 0);
                    const spentToday = c.stats.find((s) => s.day === day)?.spendCents ?? 0;
                    return (
                      <tr key={c.id} className="border-t border-slate-800">
                        <td className="py-2">
                          <span className={c.status === "ACTIVE" ? "text-brand" : "text-slate-500"}>
                            {c.status === "ACTIVE" ? "● Active" : "❚❚ Paused"}
                          </span>
                        </td>
                        <td>{fmt(c.bidCents)}</td>
                        <td>{fmt(c.dailyBudgetCents)}</td>
                        <td>{fmt(spentToday)}</td>
                        <td>{imp}</td>
                        <td>{clk}</td>
                        <td>{imp ? ((clk / imp) * 100).toFixed(1) : "0.0"}%</td>
                        <td>{fmt(spend)}</td>
                        <td className="text-right">
                          <form action={toggleCampaign}>
                            <input type="hidden" name="id" value={c.id} />
                            <button className="btn-ghost px-2 py-1 text-xs">
                              {c.status === "ACTIVE" ? "Pause" : "Resume"}
                            </button>
                          </form>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
