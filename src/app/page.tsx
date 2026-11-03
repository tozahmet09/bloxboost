import Link from "next/link";
import { db } from "@/lib/db";
import { parseTrailer } from "@/lib/trailer";
import { TrailerCard, type TrailerGame } from "@/components/TrailerCard";

export const dynamic = "force-dynamic";

type Row = { id: string; name: string; genre: string; playing: number; iconUrl: string | null; trailerUrl: string | null };
const toCard = (g: Row): TrailerGame => ({ ...g, trailer: parseTrailer(g.trailerUrl) });

export default async function Home() {
  const now = new Date();
  const featured = (await db.game.findMany({ where: { featuredUntil: { gt: now } }, take: 12 })).map(toCard);
  featured.sort(() => Math.random() - 0.5); // every featured game gets the big spot sometimes
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
    <div className="space-y-10">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold sm:text-4xl">
            New Roblox games, <span className="text-brand">before they blow up</span>
          </h1>
          <p className="mt-2 text-slate-400">Watch the trailer, click, play. Every game here is made by an indie dev.</p>
        </div>
        <Link href="/signup" className="btn-ghost text-sm">Made a game? Get players →</Link>
      </section>

      {spotlight && (
        <section>
          <TrailerCard game={spotlight} featured big />
        </section>
      )}

      {featuredRest.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-bold">🔥 Featured</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredRest.map((g) => <TrailerCard key={g.id} game={g} featured />)}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-xl font-bold">✨ New on BloxBoost</h2>
        {fresh.length === 0 ? (
          <p className="text-slate-400">No games yet. <Link href="/signup" className="text-brand underline">Add the first one</Link>.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {fresh.map((g) => <TrailerCard key={g.id} game={g} />)}
          </div>
        )}
      </section>

      <section className="card grid gap-6 p-6 sm:grid-cols-[1fr_2fr] sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Made a Roblox game?</h2>
          <p className="mt-2 text-sm text-slate-400">Get your first 100 real players without a big ad budget.</p>
          <Link href="/signup" className="btn mt-4">Get players</Link>
        </div>
        <ul className="grid gap-3 text-sm sm:grid-cols-3">
          <li><b>Add your game</b><p className="text-slate-400">Paste your Roblox link, add a trailer and our small tracker script.</p></li>
          <li><b>Earn or buy credits</b><p className="text-slate-400">Play 10 min + feedback = 1 credit. Or $5 for 50 players.</p></li>
          <li><b>Get verified players</b><p className="text-slate-400">Players count only after 10+ minutes in your game.</p></li>
        </ul>
      </section>
    </div>
  );
}
