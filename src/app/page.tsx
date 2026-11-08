import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { parseTrailer } from "@/lib/trailer";
import { earningGameIds, isVerifiedGame } from "@/lib/credits";
import { topGames } from "@/lib/community";
import { Rail } from "@/components/Rail";
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
    await db.game.findMany({ where: { id: { in: [...earning] } }, orderBy: { createdAt: "desc" }, take: 24 })
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
    <div className="space-y-14 sm:space-y-16">
      {deleted && <p role="status" className="notice">Your account was deleted.</p>}

      <section className="-mt-2 sm:-mt-4">
        <h1 className="max-w-2xl text-[32px] font-bold leading-[1.08] sm:text-[42px]">
          New Roblox games, <span className="text-mute">before they blow up.</span>
        </h1>
        <p className="mt-3 max-w-md text-mute">Watch trailers and play new games. Developers play each other&apos;s games to get real players.</p>
        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
          <Link href="/play" className="btn">Play &amp; earn credits</Link>
          <Link href="/how-it-works" className="link">How it works <ArrowRight className="h-3.5 w-3.5" /></Link>
        </div>
      </section>

      <section aria-labelledby="earn-title">
        <Head id="earn-title" title="Play & earn credits" sub="Play 10 minutes and leave a review. You get 1 credit, worth 1 real player for your game.">
          <Link href="/play" className="link-accent">Start earning <ArrowRight className="h-3.5 w-3.5" /></Link>
        </Head>
        {earn.length === 0 ? (
          <p className="text-sm text-mute">No games are giving credits right now. New ones arrive all the time.</p>
        ) : (
          <Rail label="Games that give credits">
            {earn.map((g) => <EarnRow key={g.id} game={g} href="/play" />)}
          </Rail>
        )}
      </section>

      {spotlight && <Spotlight game={spotlight} />}

      {featuredRest.length > 0 && (
        <section aria-labelledby="featured-title">
          <Head id="featured-title" title="Featured" />
          <Rail label="Featured games">
            {featuredRest.map((g) => <TrailerCard key={g.id} game={g} />)}
          </Rail>
        </section>
      )}

      {hot.length > 0 && (
        <section aria-labelledby="hot-title">
          <Head id="hot-title" title="Most liked this week">
            <Link href="/leaderboard" className="link">Leaderboards <ArrowRight className="h-3.5 w-3.5" /></Link>
          </Head>
          <Rail label="Most liked this week">
            {hot.map((g) => <TrailerCard key={g.id} game={g} />)}
          </Rail>
        </section>
      )}

      <section aria-labelledby="all-title">
        <Head id="all-title" title="All games" sub="Play for fun. These don't give credits right now.">
          <div className="flex gap-4 text-sm" role="tablist" aria-label="Sort games">
            {([["/", "Newest", !byLikes], ["/?sort=liked", "Most liked", byLikes]] as const).map(([href, label, on]) => (
              <Link key={href} href={href} role="tab" aria-selected={on} className={`border-b-2 pb-1 transition ${on ? "border-marquee font-semibold text-cream" : "border-transparent text-mute hover:text-cream"}`}>
                {label}
              </Link>
            ))}
          </div>
        </Head>
        {fresh.length === 0 ? (
          <p className="text-sm text-mute">
            Nothing here yet. <Link href="/signup" className="text-marquee underline underline-offset-4">Add the first game.</Link>
          </p>
        ) : (
          <Rail label="All games">
            {fresh.map((g) => <TrailerCard key={g.id} game={g} />)}
          </Rail>
        )}
      </section>

      <section className="rule grid gap-10 pt-12 md:grid-cols-[1fr_2fr]">
        <div>
          <p className="eyebrow">For developers</p>
          <h2 className="mt-2 text-2xl font-bold">Your first 100 real players.</h2>
          <p className="mt-2 max-w-sm text-sm text-mute">Play other games to earn credits. Each credit brings one real player to yours.</p>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link href="/signup" className="btn">Get players</Link>
            <Link href="/how-it-works" className="link">How it works <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
        </div>
        <ol className="grid gap-8 sm:grid-cols-3">
          {([
            ["Play 3 games", "Play 10 minutes and leave a review. Each one earns 1 credit."],
            ["Add your game", "Paste the Roblox link and a trailer."],
            ["Get real players", "Each one played 10+ minutes and left a review."],
          ] as const).map(([t, d], i) => (
            <li key={t}>
              <div className="font-display text-sm font-bold tabular-nums text-marquee">0{i + 1}</div>
              <div className="mt-2 font-semibold">{t}</div>
              <p className="mt-1 text-sm text-mute">{d}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

/** Section title row: title, one quiet line under it, an optional text link on the right. No frame. */
function Head({ id, title, sub, children }: { id: string; title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div>
        <h2 id={id} className="h-section">{title}</h2>
        {sub && <p className="sub">{sub}</p>}
      </div>
      {children}
    </div>
  );
}
