import Link from "next/link";
import { db } from "@/lib/db";
import { GameCard } from "@/components/GameCard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const now = new Date();
  const featured = await db.game.findMany({ where: { featuredUntil: { gt: now } }, take: 12 });
  // shuffle so every featured game gets the top spot sometimes
  featured.sort(() => Math.random() - 0.5);
  const fresh = await db.game.findMany({
    where: { OR: [{ featuredUntil: null }, { featuredUntil: { lte: now } }] },
    orderBy: { createdAt: "desc" },
    take: 24,
  });

  return (
    <div className="space-y-12">
      <section className="py-6 text-center">
        <h1 className="text-4xl font-extrabold sm:text-5xl">
          Your first <span className="text-brand">100 real players</span>,<br className="hidden sm:block" /> without a big ad budget
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-slate-400">
          Play other developers&apos; games for 10 minutes and leave honest feedback. Each one earns you a credit.
          Each credit brings a real player to your game, verified in-game. No time? Packs start at $5 for 50 players.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/signup" className="btn">Get players for my game</Link>
          <Link href="/play" className="btn-ghost">Play &amp; earn credits</Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ["1. Add your game", "Paste your Roblox link and drop our small tracker script into ServerScriptService."],
          ["2. Earn or buy credits", "Play 10 min + feedback = 1 credit. Or $5 = 50, $10 = 120, $20 = 300."],
          ["3. Get verified players", "Players only count after 10+ minutes in your game. You see every review."],
        ].map(([t, d]) => (
          <div key={t} className="card p-5">
            <div className="font-bold">{t}</div>
            <p className="mt-1 text-sm text-slate-400">{d}</p>
          </div>
        ))}
      </section>

      {featured.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-bold">🔥 Featured today</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {featured.map((g) => <GameCard key={g.id} {...g} featured />)}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-xl font-bold">✨ New on BloxBoost</h2>
        {fresh.length === 0 ? (
          <p className="text-slate-400">No games yet. <Link href="/signup" className="text-brand underline">Add the first one</Link>.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {fresh.map((g) => <GameCard key={g.id} {...g} />)}
          </div>
        )}
      </section>
    </div>
  );
}
