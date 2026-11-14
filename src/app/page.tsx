import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { parseTrailer } from "@/lib/trailer";
import { earningGameIds, isVerifiedGame, playQueue } from "@/lib/credits";
import { getUser } from "@/lib/auth";
import { Rail } from "@/components/Rail";
import { ImmersiveHero, TrailerCard, type TrailerGame } from "@/components/TrailerCard";
import { displayName, gameThumbnails } from "@/lib/thumbs";
import { releaseLabel } from "@/lib/release";

export const dynamic = "force-dynamic";

type Row = { id: string; name: string; description: string; universeId: string | null; genre: string; playing: number; iconUrl: string | null; trailerUrl: string | null; scriptLastSeen: Date | null; seriesTestedAt?: Date | null };
// Pick fields one by one: this goes to the browser, so the game's tracker secret must never be in it.
const toCard = (g: Row): TrailerGame => ({
  id: g.id,
  name: displayName(g.name),
  genre: g.genre,
  pitch: pitchOf(g.description),
  playing: g.playing,
  iconUrl: g.iconUrl,
  trailer: parseTrailer(g.trailerUrl),
  verified: isVerifiedGame(g),
  tested: !!g.seriesTestedAt,
});

/** First sentence or two of the description, short enough for the hero. */
function pitchOf(d: string) {
  const one = d.replace(/\s+/g, " ").trim();
  if (/^\[.*\]$/.test(one)) return ""; // Roblox placeholder like "[DESCRIPTION UNAVAILABLE]"
  if (one.length <= 140) return one;
  const cut = one.slice(0, 140);
  const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "));
  return end > 60 ? cut.slice(0, end + 1) : cut.replace(/\s+\S*$/, "") + "…";
}

export default async function Home({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const { deleted } = await searchParams;
  const now = new Date();
  const user = await getUser();
  // Games that give THIS player a credit: logged in, the ones they haven't played yet (not their own); logged out, every game with free slots.
  const earning = user ? new Set((await playQueue(user.id)).map((c) => c.gameId)) : await earningGameIds();
  const earn = (
    await db.game.findMany({ where: { id: { in: [...earning] }, hiddenAt: null }, orderBy: { createdAt: "desc" }, take: 24 })
  )
    .map(toCard)
    .map((g) => ({ ...g, earns: true }))
    .sort((a, b) => Number(!!b.verified) - Number(!!a.verified));
  const featuredRows = await db.game.findMany({ where: { featuredUntil: { gt: now }, hiddenAt: null }, take: 12 });
  const featured = featuredRows.map(toCard);
  featured.sort(() => Math.random() - 0.5); // a different featured game leads the hero on each visit

  // Not out yet: soonest release first. They join "All games" on their day.
  const soon = (await db.game.findMany({ where: { releaseAt: { gt: now }, hiddenAt: null }, orderBy: { releaseAt: "asc" }, take: 24 })).map((g) => ({
    ...toCard(g),
    release: releaseLabel(g.releaseAt!, now),
  }));

  // Every released game, credit or not. Here the button is always just "Play" (credits live in the row above).
  const fresh = (
    await db.game.findMany({
      where: { hiddenAt: null, OR: [{ releaseAt: null }, { releaseAt: { lte: now } }] },
      orderBy: { createdAt: "desc" },
      take: 40,
    })
  )
    .map(toCard)
    .sort((a, b) => Number(!!b.trailer) - Number(!!a.trailer));

  // Wide Roblox screenshots for every card on the page (one cached call).
  const all = [...featured, ...earn, ...fresh, ...soon];
  const universe = new Map<string, string | null>();
  for (const r of [...featuredRows, ...(await db.game.findMany({ where: { id: { in: all.map((g) => g.id) } }, select: { id: true, universeId: true } }))]) universe.set(r.id, r.universeId);
  const thumbs = await gameThumbnails([...universe.values()]);
  for (const g of all) g.thumb = thumbs.get(universe.get(g.id) ?? "") ?? null;

  // Hero: paid featured games first, then games that give credits, then the newest. Up to 5, each with a picture.
  const heroIds = new Set<string>();
  const hero = [...featured, ...earn, ...fresh].filter((g) => (g.thumb || g.trailer) && !heroIds.has(g.id) && heroIds.add(g.id)).slice(0, 5);

  // Only the first card of each game gets a view-transition name (two elements with one name cancel the animation).
  const named = new Set<string>();
  const vt = (list: TrailerGame[]) => list.map((g) => (named.has(g.id) ? g : (named.add(g.id), { ...g, vt: true })));
  const earnRow = vt(earn);
  const freshRow = vt(fresh);
  const soonRow = vt(soon);

  return (
    <div className="-mb-8 space-y-14 sm:-mb-12 sm:space-y-16">

      {hero.length > 0 ? (
        <div className="-mt-[5.5rem] sm:-mt-[6.5rem]">
          <ImmersiveHero games={hero} />
        </div>
      ) : (
        <section className="-mt-2 sm:-mt-4">
          <h1 className="max-w-2xl text-[32px] font-semibold leading-[1.06] tracking-[-0.035em] sm:text-[44px]">
            New Roblox games, <span className="text-faint">before they blow up.</span>
          </h1>
          <p className="mt-3 max-w-md text-mute">Watch trailers and play new games. Developers play each other&apos;s games to get real players.</p>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link href="#earn-title" className="btn">Play &amp; earn credits</Link>
            <Link href="/how-it-works" className="link">How it works <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
        </section>
      )}

      <div className="relative z-10 space-y-12 sm:space-y-14">
      {deleted && <p role="status" className="notice">Your account was deleted.</p>}
      {hero.length > 0 && (
        <p className="-mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-line pb-5 text-sm text-mute sm:-mt-6">
          <span><span className="font-semibold text-cream">New Roblox games, before they blow up.</span> Developers play each other&apos;s games to get real players.</span>
          <Link href="/how-it-works" className="link">How it works <ArrowRight className="h-3.5 w-3.5" /></Link>
        </p>
      )}

      <section aria-labelledby="earn-title">
        <Head id="earn-title" eyebrow="01 — Earn" accent title="Play & earn credits" sub="Play 10 minutes, get 1 credit, worth 1 real player for your game.">
          <Link href="/play" className="link-accent">My progress <ArrowRight className="h-3.5 w-3.5" /></Link>
        </Head>
        {earn.length === 0 ? (
          <p className="text-sm text-mute">No games give you a credit right now. New ones arrive all the time.</p>
        ) : (
          <Rail label="Games that give credits">
            {earnRow.map((g) => <TrailerCard key={g.id} game={g} />)}
          </Rail>
        )}
      </section>

      <section aria-labelledby="all-title">
        <Head id="all-title" eyebrow="02 — All" title="All games" sub="Every game on Spawnswap. Play anything you like." />
        {fresh.length === 0 ? (
          <p className="text-sm text-mute">
            Nothing here yet. <Link href="/signup" className="text-lime underline underline-offset-4">Add the first game.</Link>
          </p>
        ) : (
          <Rail label="All games">
            {freshRow.map((g) => <TrailerCard key={g.id} game={g} />)}
          </Rail>
        )}
      </section>

      {soon.length > 0 && (
        <section aria-labelledby="soon-title">
          <Head id="soon-title" eyebrow="03 — Soon" title="Coming soon" sub="Games with a release date. Watch the trailer now, play on launch day." />
          <Rail label="Coming soon">
            {soonRow.map((g) => <TrailerCard key={g.id} game={g} />)}
          </Rail>
        </section>
      )}

      </div>

      {/* Developer band: full width, a shade darker than the page, with a hairline on top. */}
      <section className="relative left-1/2 w-screen -translate-x-1/2 border-t border-line bg-navy-deep/70 text-cream">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-[1fr_2fr]">
          <div>
            <p className="font-mono text-[11px] font-medium uppercase tracking-[.08em] text-lime-ink">For developers</p>
            <h2 className="mt-2 text-[28px] font-semibold leading-[1.1] tracking-[-0.03em]">Your first 100 real players.</h2>
            <p className="mt-2 max-w-sm text-sm text-mute">Play other games to earn credits. Each credit brings one real player to yours.</p>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Link href="/signup" className="btn">Get players</Link>
              <Link href="/how-it-works" className="inline-flex items-center gap-1 text-sm font-medium text-mute transition hover:text-cream">How it works <ArrowRight className="h-3.5 w-3.5" /></Link>
            </div>
          </div>
          <ol className="grid gap-8 sm:grid-cols-3">
            {([
              ["Add your game", "Paste the Roblox link. It shows on the site right away."],
              ["Earn credits", "Play other games for 10 minutes. Each one earns 1 credit."],
              ["Get real players", "Each credit brings one real player who plays 10+ minutes."],
            ] as const).map(([t, d], i) => (
              <li key={t}>
                <div className="font-mono text-[32px] leading-none tabular-nums text-lime-ink">0{i + 1}</div>
                <div className="mt-4 font-semibold">{t}</div>
                <p className="mt-1 text-sm text-mute">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}

/** Section title row: title, one quiet line under it, an optional text link on the right. No frame. */
function Head({ id, title, sub, eyebrow, accent, children }: { id: string; title: string; sub?: string; eyebrow?: string; accent?: boolean; children?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div>
        {eyebrow && <p className={`mb-1.5 font-mono text-xs ${accent ? "text-lime" : "text-faint"}`}>{eyebrow}</p>}
        <h2 id={id} className="h-section">{title}</h2>
        {sub && <p className="sub">{sub}</p>}
      </div>
      {children}
    </div>
  );
}
