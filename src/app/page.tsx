import Link from "next/link";
import { ArrowRight, Gamepad2, Link2, Play, Ticket, Trophy, Users } from "lucide-react";
import { db } from "@/lib/db";
import { parseTrailer } from "@/lib/trailer";
import { earningGameIds, isVerifiedGame } from "@/lib/credits";
import { topGames } from "@/lib/community";
import { EarnRow, Spotlight, TrailerCard, type TrailerGame } from "@/components/TrailerCard";

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
    <div className="space-y-10">
      {deleted && <p role="status" className="rounded-ctl border border-line px-4 py-3 text-sm text-mute">Your account was deleted.</p>}

      <section className="relative -mt-8 pb-2 pt-6 sm:-mt-10 sm:pt-10">
        {/* Warm light sweeping in from the right, like stage lights. Decorative only. */}
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-1/2 w-screen -translate-x-1/2 overflow-hidden">
          <div className="absolute -right-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-marquee/20 blur-[120px]" />
          <div className="absolute right-10 top-24 h-64 w-64 rounded-full bg-[#5b4bff]/20 blur-[100px]" />
          <svg className="absolute -right-24 top-0 hidden h-full w-[70%] md:block" viewBox="0 0 800 400" fill="none" preserveAspectRatio="none">
            <path d="M0 380 C 260 300, 520 120, 820 40" stroke="url(#arc1)" strokeWidth="2" />
            <path d="M80 400 C 340 330, 600 200, 820 150" stroke="url(#arc2)" strokeWidth="1.5" />
            <defs>
              <linearGradient id="arc1" x1="0" x2="1"><stop stopColor="#ffb238" stopOpacity="0" /><stop offset=".6" stopColor="#ffb238" stopOpacity=".7" /><stop offset="1" stopColor="#ffb238" stopOpacity="0" /></linearGradient>
              <linearGradient id="arc2" x1="0" x2="1"><stop stopColor="#e2574c" stopOpacity="0" /><stop offset=".7" stopColor="#e2574c" stopOpacity=".45" /><stop offset="1" stopColor="#e2574c" stopOpacity="0" /></linearGradient>
            </defs>
          </svg>
          <div className="absolute right-[12%] top-16 hidden h-20 w-20 rotate-12 rounded-[14px] border border-white/10 bg-gradient-to-br from-white/10 to-transparent backdrop-blur-sm md:block" />
          <div className="absolute right-[28%] top-48 hidden h-10 w-10 -rotate-6 rounded-[10px] border border-marquee/30 bg-marquee/10 md:block" />
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-ink" />
        </div>
        <div className="relative max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-panel/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[.14em] text-marquee">
            <span className="h-1.5 w-1.5 rounded-full bg-marquee" aria-hidden /> Now showing
          </span>
          <h1 className="mt-4 text-[34px] font-extrabold leading-[1.04] tracking-tight sm:text-[44px]">
            New Roblox games,
            <br />
            <span className="bg-gradient-to-r from-marquee via-[#ff9a3d] to-velvet bg-clip-text text-transparent">before they blow up.</span>
          </h1>
          <p className="mt-3 max-w-lg text-[15px] text-mute">Watch trailers, play, like the ones you love. Devs play each other&apos;s games and help them grow.</p>
          <Link href="/how-it-works" className="mt-5 inline-flex min-h-[40px] items-center gap-2 rounded-full border border-line bg-ink/40 py-1 pl-1 pr-4 text-sm font-semibold backdrop-blur transition hover:border-mute">
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-line"><Play className="ml-0.5 h-3 w-3 fill-current" /></span>
            How It Works
          </Link>
        </div>
      </section>

      <section aria-labelledby="earn-title" className="relative rounded-[20px] bg-gradient-to-b from-marquee/50 via-line to-marquee/30 p-px shadow-[0_20px_80px_-30px_rgba(255,178,56,.35)]">
        <div className="rounded-[19px] bg-[linear-gradient(180deg,#1d1822_0%,#16121b_100%)] p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-3 border-b border-line pb-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-marquee/10 ring-1 ring-marquee/30">
              <Ticket className="h-5 w-5 text-marquee" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="earn-title" className="text-lg font-bold sm:text-xl">Play &amp; Earn Credits</h2>
              <p className="mt-0.5 text-sm text-mute">Play one of these for 10 min and leave a review. You get 1 credit for your own game.</p>
            </div>
            <Link href="/play" className="btn min-h-[40px] w-full rounded-full text-sm sm:w-auto">
              Start Earning <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {earn.length === 0 ? (
            <p className="pt-6 text-center text-sm text-mute">No games are giving credits right now. New ones arrive all the time.</p>
          ) : (
            <div className="grid grid-cols-2 gap-x-3 gap-y-5 pt-4 lg:grid-cols-4">
              {earn.map((g) => <EarnRow key={g.id} game={g} href="/play" />)}
            </div>
          )}
        </div>
      </section>

      {spotlight && <Spotlight game={spotlight} />}

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
            <h2 className="text-xl font-bold">Most Liked This Week</h2>
            <Link href="/leaderboard" className="flex items-center gap-1.5 text-sm text-mute hover:text-cream"><Trophy className="h-4 w-4" /> Leaderboards</Link>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
            {hot.map((g) => <TrailerCard key={g.id} game={g} />)}
          </div>
        </section>
      )}

      <section>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">All Games</h2>
            <p className="mt-1 text-sm text-mute">Play for fun. These don&apos;t give credits right now.</p>
          </div>
          <div className="flex rounded-full border border-line p-1 text-sm" role="tablist" aria-label="Sort games">
            <Link href="/" role="tab" aria-selected={!byLikes} className={`rounded-full px-4 py-1.5 transition ${!byLikes ? "bg-panel font-semibold text-cream ring-1 ring-line" : "text-mute hover:text-cream"}`}>Newest</Link>
            <Link href="/?sort=liked" role="tab" aria-selected={byLikes} className={`rounded-full px-4 py-1.5 transition ${byLikes ? "bg-panel font-semibold text-cream ring-1 ring-line" : "text-mute hover:text-cream"}`}>Most Liked</Link>
          </div>
        </div>
        {fresh.length === 0 ? (
          <p className="flex items-center justify-center gap-3 py-6 text-mute">
            <Gamepad2 className="h-5 w-5" /> Nothing here yet. <Link href="/signup" className="text-marquee underline underline-offset-4">Add the first game.</Link>
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
            {fresh.map((g) => <TrailerCard key={g.id} game={g} />)}
          </div>
        )}
      </section>

      <section className="grid gap-8 rounded-[20px] border border-line bg-panel/40 p-5 sm:p-6 md:grid-cols-[1fr_auto_2fr] md:items-center">
        <div>
          <p className="eyebrow">For developers</p>
          <h2 className="mt-1.5 text-xl font-bold sm:text-2xl">Your first 100 real players.</h2>
          <p className="mt-2 text-sm text-mute">Play other games to earn credits. Each credit brings one real player to yours.</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link href="/signup" className="btn">Get Players</Link>
            <Link href="/how-it-works" className="btn-quiet">How It Works</Link>
          </div>
        </div>
        <div className="hidden h-full w-px bg-line md:block" aria-hidden />
        <ol className="grid gap-6 sm:grid-cols-3">
          {([
            [Play, "Play 3 games", "Play 10 min and review. Each one earns you 1 credit."],
            [Link2, "Add your game", "Paste the Roblox link and a trailer."],
            [Users, "Get verified players", "Each one played 10+ minutes and left a review."],
          ] as const).map(([Icon, t, d], i) => (
            <li key={t}>
              <span className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-ink ring-1 ring-line">
                <Icon className="h-5 w-5 text-marquee" />
              </span>
              <div className="mt-4 font-semibold">{i + 1}. {t}</div>
              <p className="mt-1 text-sm text-mute">{d}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
