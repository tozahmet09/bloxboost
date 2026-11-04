import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { parseTrailer } from "@/lib/trailer";
import { isVerifiedGame } from "@/lib/credits";
import { Spotlight, TrailerCard, type TrailerGame } from "@/components/TrailerCard";

export const dynamic = "force-dynamic";

type Row = { id: string; name: string; genre: string; playing: number; iconUrl: string | null; trailerUrl: string | null; scriptLastSeen: Date | null };
// Pick fields one by one: this goes to the browser, so the game's tracker secret must never be in it.
const toCard = (g: Row): TrailerGame => ({
  id: g.id,
  name: g.name,
  genre: g.genre,
  playing: g.playing,
  iconUrl: g.iconUrl,
  trailer: parseTrailer(g.trailerUrl),
  verified: isVerifiedGame(g),
});

export default async function Home() {
  const now = new Date();
  const featured = (await db.game.findMany({ where: { featuredUntil: { gt: now } }, take: 12 })).map(toCard);
  featured.sort(() => Math.random() - 0.5); // a different featured game gets the spotlight on each visit
  const spotlight = featured.find((g) => g.trailer) ?? null;
  const featuredRest = featured.filter((g) => g !== spotlight);

  // Games with a trailer come first, newest first within each group.
  const fresh = (
    await db.game.findMany({
      where: { OR: [{ featuredUntil: null }, { featuredUntil: { lte: now } }] },
      orderBy: { createdAt: "desc" },
      take: 30,
    })
  )
    .map(toCard)
    .sort((a, b) => Number(!!b.trailer) - Number(!!a.trailer));

  return (
    <div className="space-y-12">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Now showing</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-5xl">New Roblox games, before they blow up.</h1>
        </div>
        <Link href="/signup" className="group flex items-center gap-1 text-sm text-mute hover:text-cream">
          Made a game? Get players <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </Link>
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

      <section>
        <h2 className="mb-4 text-xl font-bold">Just released</h2>
        {fresh.length === 0 ? (
          <p className="text-mute">Nothing here yet. <Link href="/signup" className="text-marquee underline">Add the first game</Link>.</p>
        ) : (
          <div className="grid gap-x-4 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
            {fresh.map((g) => <TrailerCard key={g.id} game={g} />)}
          </div>
        )}
      </section>

      <section className="rule grid gap-8 pt-10 md:grid-cols-[1fr_2fr]">
        <div>
          <p className="eyebrow">For developers</p>
          <h2 className="mt-1 text-2xl font-bold">Your first 100 real players.</h2>
          <Link href="/signup" className="btn mt-5">Get players</Link>
        </div>
        <ol className="grid gap-6 sm:grid-cols-3">
          {[
            ["Add your game", "Paste the Roblox link and a trailer."],
            ["Earn or buy credits", "Play a game 10 min + review = 1 credit. Or 50 for $5."],
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
