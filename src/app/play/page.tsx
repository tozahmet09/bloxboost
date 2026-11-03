import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { playQueue } from "@/lib/credits";
import { REQUIRED_SECONDS } from "@/lib/money";
import { GameIcon } from "@/components/GameCard";
import { playGame } from "../actions";

export const dynamic = "force-dynamic";

export default async function Play({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await getUser();
  if (!user) redirect("/signup");
  const { error } = await searchParams;
  const mins = Math.round(REQUIRED_SECONDS / 60);

  if (!user.robloxVerified) {
    return (
      <div className="card mx-auto max-w-lg p-6 text-center">
        <h1 className="text-2xl font-bold">Link your Roblox account</h1>
        <p className="mt-2 text-slate-400">
          We need to know which Roblox player is you, so the game can confirm you actually played.
        </p>
        <Link href="/dashboard/roblox" className="btn mt-4">Link Roblox account</Link>
      </div>
    );
  }

  const queue = await playQueue(user.id);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold">Play &amp; earn</h1>
          <p className="text-sm text-slate-400">
            Play a game for {mins}+ minutes as <b>{user.robloxUsername}</b>, then leave feedback: +1 credit each.
          </p>
        </div>
        <Link href="/play/tasks" className="btn-ghost ml-auto">My games in progress</Link>
      </div>
      {error && <p className="rounded-lg bg-red-500/10 p-2 text-sm text-red-400">{error}</p>}
      {queue.length === 0 ? (
        <div className="card p-8 text-center text-slate-400">No games need players right now. Check back soon!</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {queue.map((c) => (
            <div key={c.id} className="card flex gap-4 p-4">
              <GameIcon url={c.game.iconUrl} className="h-20 w-20 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{c.game.name}</div>
                <div className="text-xs text-slate-400">{c.game.genre}</div>
                <p className="mt-1 line-clamp-2 text-xs text-slate-500">{c.game.description}</p>
                <form action={playGame} className="mt-2">
                  <input type="hidden" name="gameId" value={c.gameId} />
                  <button className="btn px-3 py-1 text-sm">Play (+1 ⭐)</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
