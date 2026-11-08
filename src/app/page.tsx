import Link from "next/link";
import { ArrowRight, Ticket, Trophy } from "lucide-react";
import { db } from "@/lib/db";
import { parseTrailer } from "@/lib/trailer";
import { earningGameIds, isVerifiedGame } from "@/lib/credits";
import { topGames } from "@/lib/community";
import { Spotlight, TrailerCard, type TrailerGame } from "@/components/TrailerCard";

export const dynamic = "force-dynamic";

type Row = { id: string; name: string; genre: string; playing: number; iconUrl: string | null; trailerUrl: string | null; scriptLastSeen: Date | null; likeCount: number };
// Pick fields one by one: this goes to the browser, so the game's tracker secret must never be in it.
const toCard = (g: Row): TrailerGame => ({
  id: g.id,
  name: g.name,
  genre: g.genre,
  playing: g.playing,
  iconUrl: g.iconUrl,
  trailer: parseTrailer(g.trailerUrl),
  verified: isVerifiedGame(g),
  likes: g.likeCount,
});

export default async function Home({ searchParams }: { searchParams: Promise<{ sort?: string; deleted?: string }> }) {
  const { sort, deleted } = await searchParams;
  const now = new Date();
  const earning = await earningGameIds();
  const mark = (g: TrailerGame) => ((g.earns = earning.has(g.id)), g);
  // Games that give a credit right now, verified (tracker script) first, then newest.
  const earn = (
    await db.game.findMany({ where: { id: { in: [...earning] } }, orderBy: { createdAt: "desc" }, take: 10 })
  )
    .map(toCard)
    .map(mark)
    .sort((a, b) => Number(!!b.verified) - Number(!!a.verified));
  // "Most liked this week", falling back to all-time while the site is quiet.
  let hot = (await topGames(6, 7)).map(toCard).map(mark);
  if (hot.length < 3) hot = (await topGames(6)).map(toCard).map(mark);
  hot.forEach((g, i) => (g.rank = i + 1));
  const featured = (await db.game.findMany({ where: { featuredUntil: { gt: now } }, take: 12 })).map(toCard).map(mark);
  featured.sort(() => Math.random() - 0.5); // a different featured game gets the spotlight on each visit
  const spotlight = featured.find((g) => g.trailer) ?? null;
  const featuredRest = featured.filter((g) => g !== spotlight);

  // Everything that doesn't give a credit right now. Trailers first, newest first within each group.
  const byLikes = sort === "liked";
  const fresh = (
    await db.game.findMany({
      where: { id: { notIn: [...earning] }, OR: [{ featuredUntil: null }, { featuredUntil: { lte: now } }] },
      orderBy: byLikes ? [{ likeCount: "desc" }, { createdAt: "desc" }] : { createdAt: "desc" },
      take: 30,
    })
  )
    .map(toCard)
    .sort((a, b) => (byLikes ? 0 : Number(!!b.trailer) - Number(!!a.trailer)));

  return (
    <div className="space-y-12">
      {deleted && <p role="status" className="rounded-ctl border border-line px-4 py-3 text-sm text-mute">Your account was deleted.</p>}
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Now showing</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-5xl">New Roblox games, before they blow up.</h1>
          <p className="mt-2 max-w-xl text-mute">Watch trailers, play, like the ones you love. Devs play each other&apos;s games and help them grow. <Link href="/how-it-works" className="text-cream underline">How it works</Link></p>
        </div>
        <Link href="/signup" className="group flex items-center gap-1 text-sm text-mute hover:text-cream">
          Made a game? Get players <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </Link>
      </section>

      {spotlight && <Spotlight game={spotlight} />}

      <section aria-labelledby="earn-title">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="earn-title" className="flex items-center gap-2 text-xl font-bold"><Ticket className="h-5 w-5 text-marquee" /> Play &amp; earn credits</h2>
            <p className="mt-1 text-sm text-mute">Play one of these for 10 min and leave a review. You get 1 credit for your own game.</p>
          </div>
          <Link href="/play" className="group flex items-center gap-1 text-sm text-mute hover:text-cream">
            Start earning <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </Link>
        </div>
        {earn.length === 0 ? (
          <p className="rounded-media border border-dashed border-line px-6 py-10 text-center text-mute">No games are giving credits right now. New ones arrive all the time.</p>
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
            {earn.map((g) => <TrailerCard key={g.id} game={g} href="/play" />)}
          </div>
        )}
      </section>

      {featuredRest.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-bold">Featured</h2>
          <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
            {featuredRest.map((g) => (
              <div key={g.id} className="w-[78%] shrink-0 snap-start sm:w-auto">
                <TrailerCard game={g} featured />
              </div>
            ))}
          </div>
        </section>
      )}

      {hot.length > 0 && (
        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <h2 className="text-xl font-bold">Most liked this week</h2>
            <Link href="/leaderboard" className="flex items-center gap-1.5 text-sm text-mute hover:text-cream"><Trophy className="h-4 w-4" /> Leaderboards</Link>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
            {hot.map((g) => <TrailerCard key={g.id} game={g} />)}
          </div>
        </section>
      )}

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">All games</h2>
            <p className="mt-1 text-sm text-mute">Play for fun. These don&apos;t give credits right now.</p>
          </div>
          <div className="flex gap-1 text-sm" role="tablist" aria-label="Sort games">
            <Link href="/" role="tab" aria-selected={!byLikes} className={`rounded-ctl px-3 py-1.5 ${!byLikes ? "bg-panel text-cream" : "text-mute hover:text-cream"}`}>Newest</Link>
            <Link href="/?sort=liked" role="tab" aria-selected={byLikes} className={`rounded-ctl px-3 py-1.5 ${byLikes ? "bg-panel text-cream" : "text-mute hover:text-cream"}`}>Most liked</Link>
          </div>
        </div>
        {fresh.length === 0 ? (
          <p className="text-mute">Nothing here yet. <Link href="/signup" className="text-marquee underline">Add the first game</Link>.</p>
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
            {fresh.map((g) => <TrailerCard key={g.id} game={g} />)}
          </div>
        )}
      </section>

      <section className="rule grid gap-8 pt-10 md:grid-cols-[1fr_2fr]">
        <div>
          <p className="eyebrow">For developers</p>
          <h2 className="mt-1 text-2xl font-bold">Your first 100 real players.</h2>
          <p className="mt-2 text-sm text-mute">Play other games to earn credits. Each credit brings one real player to yours.</p>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <Link href="/signup" className="btn">Get players</Link>
            <Link href="/how-it-works" className="text-sm text-mute underline hover:text-cream">How it works</Link>
          </div>
        </div>
        <ol className="grid gap-6 sm:grid-cols-3">
          {[
            ["Play 3 games", "Play 10 min and review. Each one earns you 1 credit."],
            ["Add your game", "Paste the Roblox link and a trailer."],
            ["Get verified players", "Each one played 10+ minutes and left a review."],
          ].map(([t, d], i) => (
            <li key={t} className="flex gap-3">
              <span className="font-display text-2xl font-extrabold text-marquee/80 tabular-nums">{i + 1}</span>
              <div>
                <div className="font-semibold">{t}</div>
                <p className="mt-0.5 text-sm text-mute">{d}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
