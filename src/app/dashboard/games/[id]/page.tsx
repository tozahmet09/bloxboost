import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { FEATURED_OPTIONS, SCRIPT_ALIVE_MS, fmt } from "@/lib/money";
import { trackerScript } from "@/lib/script";
import { GameIcon } from "@/components/GameCard";
import { Form } from "@/components/Form";
import { cancelCampaign, createCampaign, refreshGame, toggleCampaign } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function GamePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ paid?: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const { paid } = await searchParams;
  const game = await db.game.findFirst({
    where: { id, ownerId: user.id },
    include: {
      campaigns: { orderBy: { createdAt: "desc" } },
      tasks: { where: { status: "COMPLETED" }, orderBy: { completedAt: "desc" }, take: 50, include: { player: { select: { robloxUsername: true } } } },
    },
  });
  if (!game) notFound();

  const h = await headers();
  const appUrl = process.env.APP_URL || `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const live = !!game.scriptLastSeen && game.scriptLastSeen.getTime() > Date.now() - SCRIPT_ALIVE_MS;
  const featured = game.featuredUntil && game.featuredUntil > new Date();
  const ratings = game.tasks.map((t) => t.rating ?? 0);
  const avg = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : "–";
  const since = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
  const visits7d = await db.visit.count({ where: { gameId: game.id, day: { gte: since } } });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <GameIcon url={game.iconUrl} className="h-16 w-16 rounded-xl" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-bold">{game.name}</h1>
          <div className="text-xs text-slate-400">
            {game.playing.toLocaleString()} playing now · {game.visits.toLocaleString()} total visits on Roblox
          </div>
        </div>
        <form action={refreshGame}>
          <input type="hidden" name="id" value={game.id} />
          <button className="btn-ghost text-xs">Refresh from Roblox</button>
        </form>
      </div>
      {paid && <p className="rounded-lg bg-brand/10 p-2 text-sm text-brand">Payment received. Thanks!</p>}

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          ["Verified players", game.tasks.length],
          ["Avg rating", avg],
          ["Site visits (7d)", visits7d],
          ["Your credits", user.credits],
        ].map(([k, v]) => (
          <div key={k} className="card p-4">
            <div className="text-xs text-slate-400">{k}</div>
            <div className="text-2xl font-bold">{v}</div>
          </div>
        ))}
      </div>

      <section className="card space-y-3 p-5">
        <div className="flex items-center">
          <h2 className="text-lg font-bold">1. Install the tracker</h2>
          <span className={`ml-auto text-sm ${live ? "text-brand" : "text-amber-300"}`}>
            {live ? `● Live, last seen ${game.scriptLastSeen!.toISOString().slice(11, 16)} UTC` : "⚠ Not detected yet"}
          </span>
        </div>
        <p className="text-sm text-slate-400">
          Your game only shows up for players after the tracker is running. It tells us when a BloxBoost player has been in your game for 10 minutes.
          Create a <b>Script</b> in <b>ServerScriptService</b>, paste this, turn on <b>Allow HTTP Requests</b>, and publish.
        </p>
        <textarea readOnly rows={8} className="input font-mono text-xs" value={trackerScript(appUrl, game.secret)} />
      </section>

      <section className="card space-y-4 p-5">
        <h2 className="text-lg font-bold">2. Get players</h2>
        <Form action={createCampaign} submit="Start campaign" className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="gameId" value={game.id} />
          <div>
            <label className="label">Players wanted (1 credit each)</label>
            <input name="players" type="number" min={1} defaultValue={Math.min(Math.max(user.credits, 1), 100)} className="input w-40" />
          </div>
        </Form>
        <p className="text-xs text-slate-500">
          Credits are reserved when you start. Cancel any time to get unused credits back.{" "}
          <Link href="/dashboard/billing" className="text-brand">Need more?</Link>
        </p>
        {game.campaigns.length > 0 && (
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-slate-400">
              <tr><th className="py-1">Started</th><th>Progress</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {game.campaigns.map((c) => (
                <tr key={c.id} className="border-t border-slate-800">
                  <td className="py-2">{c.createdAt.toISOString().slice(0, 10)}</td>
                  <td>{c.delivered} / {c.targetPlayers}</td>
                  <td>{c.status.toLowerCase()}</td>
                  <td className="flex justify-end gap-2 py-2">
                    {["ACTIVE", "PAUSED"].includes(c.status) && (
                      <>
                        <form action={toggleCampaign}>
                          <input type="hidden" name="id" value={c.id} />
                          <button className="btn-ghost px-2 py-1 text-xs">{c.status === "ACTIVE" ? "Pause" : "Resume"}</button>
                        </form>
                        <form action={cancelCampaign}>
                          <input type="hidden" name="id" value={c.id} />
                          <button className="btn-ghost px-2 py-1 text-xs">Cancel</button>
                        </form>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="text-lg font-bold">3. Feature on the homepage {featured && <span className="text-sm text-brand">🔥 until {game.featuredUntil!.toISOString().slice(0, 10)}</span>}</h2>
        <p className="text-sm text-slate-400">Show your game at the top of the BloxBoost homepage.</p>
        <form action="/api/checkout" method="post" className="flex flex-wrap gap-3">
          <input type="hidden" name="kind" value="FEATURED" />
          <input type="hidden" name="gameId" value={game.id} />
          {FEATURED_OPTIONS.map((o) => (
            <button key={o.days} name="days" value={o.days} className="btn-ghost">
              {o.days} day{o.days > 1 ? "s" : ""} · {fmt(o.cents)}
            </button>
          ))}
        </form>
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="text-lg font-bold">Player feedback</h2>
        {game.tasks.length === 0 && <p className="text-sm text-slate-400">No feedback yet.</p>}
        {game.tasks.map((t) => (
          <div key={t.id} className="border-t border-slate-800 pt-3 text-sm">
            <div className="text-xs text-slate-400">
              <span className="text-amber-300">{"★".repeat(t.rating ?? 0)}</span> · {t.player.robloxUsername} · {Math.round(t.playedSeconds / 60)} min played
            </div>
            <p className="mt-1 whitespace-pre-wrap">{t.feedback}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
