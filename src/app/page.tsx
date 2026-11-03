import Link from "next/link";
import { db } from "@/lib/db";
import { pickSponsored } from "@/lib/ads";
import { GameCard } from "@/components/GameCard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const sponsored = await pickSponsored(6);
  const sponsoredIds = new Set(sponsored.map((c) => c.gameId));
  const fresh = await db.game.findMany({ orderBy: { createdAt: "desc" }, take: 24 });

  return (
    <div className="space-y-12">
      <section className="text-center">
        <h1 className="text-4xl font-extrabold sm:text-5xl">
          Play Roblox games <span className="text-brand">before they blow up</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-400">
          Hand-picked new experiences from indie developers. Be one of the first players.
        </p>
      </section>

      {sponsored.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-bold">🔥 Featured today</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {sponsored.map((c) => (
              <GameCard key={c.id} {...c.game} campaignId={c.id} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-xl font-bold">✨ New on BloxBoost</h2>
        {fresh.length === 0 ? (
          <p className="text-slate-400">
            No games yet. <Link href="/signup" className="text-brand underline">Add the first one</Link>.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {fresh
              .filter((g) => !sponsoredIds.has(g.id))
              .map((g) => (
                <GameCard key={g.id} {...g} />
              ))}
          </div>
        )}
      </section>

      <section className="card p-6 text-center">
        <h2 className="text-2xl font-bold">Made a Roblox game?</h2>
        <p className="mt-2 text-slate-400">
          Get your first players for as little as $0.02 per click. Set a daily budget from $1, pause any time.
        </p>
        <Link href="/signup" className="btn mt-4">Start promoting</Link>
      </section>
    </div>
  );
}
