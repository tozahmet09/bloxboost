import Link from "next/link";
import { redirect } from "next/navigation";
import { BadgeCheck, Link2, ListChecks, Ticket } from "lucide-react";
import { getUser } from "@/lib/auth";
import { isVerifiedGame, playQueue } from "@/lib/credits";
import { REQUIRED_SECONDS } from "@/lib/money";
import { GameIcon } from "@/components/GameIcon";
import { playGame } from "../actions";

export const dynamic = "force-dynamic";

export default async function Play({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await getUser();
  if (!user) redirect("/signup");
  const { error } = await searchParams;
  const mins = Math.round(REQUIRED_SECONDS / 60);

  if (!user.robloxVerified) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-10 text-center">
        <Link2 className="mx-auto h-8 w-8 text-marquee" />
        <h1 className="text-2xl font-extrabold">Link your Roblox account</h1>
        <p className="text-mute">So games can see it&apos;s you playing.</p>
        <Link href="/dashboard/roblox" className="btn">Link account</Link>
      </div>
    );
  }

  const queue = await playQueue(user.id);
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Play &amp; earn</p>
          <h1 className="mt-1 text-3xl font-extrabold">Play {mins} min, review, +1 credit</h1>
          <p className="mt-1 text-sm text-mute">Playing as <b className="text-cream">{user.robloxUsername}</b></p>
        </div>
        <Link href="/play/tasks" className="btn-quiet"><ListChecks className="h-4 w-4" /> My progress</Link>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      {queue.length === 0 ? (
        <p className="rounded-media border border-dashed border-line px-6 py-14 text-center text-mute">No games need players right now. New ones arrive all the time.</p>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {queue.map((c) => (
            <li key={c.id} className="flex items-center gap-4 py-4">
              <GameIcon url={c.game.iconUrl} className="h-16 w-16 shrink-0 rounded-ctl" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{c.game.name}</div>
                <div className="flex items-center gap-2 text-xs text-mute">
                  {c.game.genre}
                  {isVerifiedGame(c.game) && <span className="inline-flex items-center gap-1 text-verified"><BadgeCheck className="h-3.5 w-3.5" /> Verified</span>}
                </div>
                <p className="mt-1 line-clamp-1 text-sm text-mute">{c.game.description}</p>
              </div>
              <form action={playGame}>
                <input type="hidden" name="gameId" value={c.gameId} />
                <button className="btn"><Ticket className="h-4 w-4" /> +1</button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
