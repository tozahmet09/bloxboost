import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { CheckCircle2, Circle, RefreshCw, Star, Pause, Play as PlayIcon, X } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { FEATURED_OPTIONS, SCRIPT_ALIVE_MS, fmt } from "@/lib/money";
import { trackerScript } from "@/lib/script";
import { checkoutNotice } from "@/lib/payments";
import { GameIcon } from "@/components/GameIcon";
import { GoalBar } from "@/components/GoalBar";
import { CopyButton } from "@/components/CopyButton";
import { Form } from "@/components/Form";
import { TrailerUpload } from "@/components/TrailerUpload";
import { cancelCampaign, createCampaign, refreshGame, toggleCampaign } from "@/app/actions";

export const dynamic = "force-dynamic";

function Step({ n, title, done, optional, children }: { n: number; title: string; done: boolean; optional?: boolean; children: React.ReactNode }) {
  return (
    <li className="grid grid-cols-[28px_1fr] gap-x-3 py-6">
      {done ? <CheckCircle2 className="mt-0.5 h-6 w-6 text-verified" /> : <Circle className="mt-0.5 h-6 w-6 text-line" />}
      <div className="min-w-0 space-y-3">
        <h2 className="text-lg font-bold">
          {n}. {title} {optional && <span className="ml-1 font-body text-sm font-normal text-mute">optional</span>}
        </h2>
        {children}
      </div>
    </li>
  );
}

export default async function GamePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paid?: string; needTrailer?: string; session_id?: string; payments?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const q = await searchParams;
  const { needTrailer } = q;
  // Runs before loading the game so a just-paid spotlight already shows as featured.
  const notice = await checkoutNotice(q, user.id);
  const game = await db.game.findFirst({
    where: { id, ownerId: user.id },
    include: {
      campaigns: { orderBy: { createdAt: "desc" } },
      tasks: {
        where: { status: "COMPLETED" },
        orderBy: { completedAt: "desc" },
        take: 50,
        include: { player: { select: { robloxUsername: true } } },
      },
    },
  });
  if (!game) notFound();

  const h = await headers();
  const appUrl = process.env.APP_URL || `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const script = trackerScript(appUrl, game.secret);
  const live = !!game.scriptLastSeen && game.scriptLastSeen.getTime() > Date.now() - SCRIPT_ALIVE_MS;
  const featured = !!game.featuredUntil && game.featuredUntil > new Date();
  const ratings = game.tasks.map((t) => t.rating ?? 0);
  const avg = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : null;
  const since = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
  const visits7d = await db.visit.count({ where: { gameId: game.id, day: { gte: since } } });
  const running = game.campaigns.filter((c) => ["ACTIVE", "PAUSED"].includes(c.status));

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center gap-5">
        <GameIcon url={game.iconUrl} className="h-20 w-20 rounded-media" />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="truncate text-3xl font-extrabold">{game.name}</h1>
            {featured && <span className="chip bg-velvet text-cream">Featured until {game.featuredUntil!.toISOString().slice(5, 10)}</span>}
          </div>
          <GoalBar count={game.tasks.length} />
          <p className="flex flex-wrap gap-x-4 text-xs text-mute">
            {avg && <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-marquee text-marquee" /> {avg} avg</span>}
            <span>{visits7d} visits from BloxBoost this week</span>
            <span>{game.playing.toLocaleString()} playing on Roblox</span>
          </p>
        </div>
        <form action={refreshGame}>
          <input type="hidden" name="id" value={game.id} />
          <button className="btn-quiet text-sm" title="Update name, icon and player count from Roblox">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </form>
      </header>
      {notice === "paid" && <p className="text-sm text-verified">Payment received.</p>}
      {notice === "processing" && <p className="text-sm text-mute">Payment is processing. The spotlight starts as soon as Stripe confirms it.</p>}
      {notice === "off" && <p className="text-sm text-mute">Spotlight purchases aren&apos;t open yet.</p>}

      <ol className="divide-y divide-line border-y border-line">
        <Step n={1} title="Install the tracker" done={live}>
          <p className="max-w-prose text-sm text-mute">
            Lets us confirm a player stayed 10 minutes. Add a <b className="text-cream">Script</b> to <b className="text-cream">ServerScriptService</b>, paste this, turn on <b className="text-cream">Allow HTTP Requests</b>, publish.
          </p>
          <div className="overflow-hidden rounded-ctl border border-line">
            <pre className="max-h-40 overflow-auto bg-panel p-3 text-xs leading-relaxed text-mute">{script}</pre>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <CopyButton text={script} label="Copy script" />
            <span className={`text-sm ${live ? "text-verified" : "text-mute"}`}>
              {live ? `Live, last ping ${game.scriptLastSeen!.toISOString().slice(11, 16)} UTC` : "Waiting for the first ping…"}
            </span>
          </div>
        </Step>

        <Step n={2} title="Add a trailer" done={!!game.trailerUrl}>
          <p className="text-sm text-mute">Games with a trailer show first. 10 to 30 seconds of gameplay.</p>
          <TrailerUpload gameId={game.id} current={game.trailerUrl} uploadsOn={!!process.env.BLOB_READ_WRITE_TOKEN} />
        </Step>

        <Step n={3} title="Get players" done={running.length > 0 || game.tasks.length > 0}>
          <p className="text-sm text-mute">1 credit = 1 verified player. You have {user.credits}. Unused credits come back if you stop.</p>
          <Form action={createCampaign} submit="Start" className="flex flex-wrap items-start gap-3" buttonClass="btn">
            <input type="hidden" name="gameId" value={game.id} />
            <input name="players" aria-label="Players wanted" type="number" min={1} defaultValue={Math.min(Math.max(user.credits, 1), 100)} className="input w-28" />
            <Link href="/dashboard/billing" className="btn-quiet">Get credits</Link>
          </Form>
          {game.campaigns.length > 0 && (
            <ul className="divide-y divide-line text-sm">
              {game.campaigns.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center gap-3 py-2.5">
                  <span className="w-24 text-mute tabular-nums">{c.createdAt.toISOString().slice(0, 10)}</span>
                  <span className="flex-1 tabular-nums">{c.delivered} of {c.targetPlayers} players</span>
                  <span className={`chip ${c.status === "ACTIVE" ? "bg-verified/10 text-verified" : "bg-line text-mute"}`}>{c.status.toLowerCase()}</span>
                  {["ACTIVE", "PAUSED"].includes(c.status) && (
                    <span className="flex gap-1">
                      <form action={toggleCampaign}>
                        <input type="hidden" name="id" value={c.id} />
                        <button className="btn-quiet min-h-[36px] px-2.5 text-xs">
                          {c.status === "ACTIVE" ? <><Pause className="h-3.5 w-3.5" /> Pause</> : <><PlayIcon className="h-3.5 w-3.5" /> Resume</>}
                        </button>
                      </form>
                      <form action={cancelCampaign}>
                        <input type="hidden" name="id" value={c.id} />
                        <button className="btn-quiet min-h-[36px] px-2.5 text-xs"><X className="h-3.5 w-3.5" /> Stop</button>
                      </form>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Step>

        <Step n={4} title="Spotlight on the homepage" done={featured} optional>
          {(needTrailer || !game.trailerUrl) && <p className="text-sm text-marquee">Needs a trailer first (step 2).</p>}
          <form action="/api/checkout" method="post" className="flex flex-wrap gap-3">
            <input type="hidden" name="kind" value="FEATURED" />
            <input type="hidden" name="gameId" value={game.id} />
            {FEATURED_OPTIONS.map((o) => (
              <button key={o.days} name="days" value={o.days} className="btn-quiet" disabled={!game.trailerUrl}>
                {o.days} day{o.days > 1 ? "s" : ""} <span className="text-mute">{fmt(o.cents)}</span>
              </button>
            ))}
          </form>
        </Step>
      </ol>

      <section className="space-y-4">
        <h2 className="text-xl font-bold">Reviews</h2>
        {game.tasks.length === 0 ? (
          <p className="text-sm text-mute">Reviews from verified players show up here.</p>
        ) : (
          <ul className="divide-y divide-line">
            {game.tasks.map((t) => (
              <li key={t.id} className="space-y-1 py-4">
                <div className="flex flex-wrap items-center gap-2 text-xs text-mute">
                  <span className="inline-flex" aria-label={`${t.rating} of 5`}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} className={`h-3.5 w-3.5 ${n <= (t.rating ?? 0) ? "fill-marquee text-marquee" : "text-line"}`} />
                    ))}
                  </span>
                  <span>{t.player.robloxUsername}</span>
                  <span>· {Math.round(t.playedSeconds / 60)} min played</span>
                </div>
                <p className="max-w-prose whitespace-pre-wrap">{t.feedback}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
