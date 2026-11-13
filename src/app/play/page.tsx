import Link from "next/link";
import { redirect } from "next/navigation";
import { BadgeCheck, Link2, ListChecks, Ticket } from "lucide-react";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { expireStaleTasks, isVerifiedGame, payPlayed, playQueue } from "@/lib/credits";
import { REQUIRED_SECONDS } from "@/lib/money";
import { GameIcon } from "@/components/GameIcon";
import { playGame } from "../actions";
import { AbandonButton } from "@/components/AbandonButton";

export const dynamic = "force-dynamic";

export default async function Play({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await getUser();
  if (!user) redirect("/signup");
  const { error } = await searchParams;
  const mins = Math.round(REQUIRED_SECONDS / 60);

  if (!user.robloxVerified) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-10 text-center">
        <Link2 className="mx-auto h-8 w-8 text-lime" />
        <h1 className="page-title">Link your Roblox account</h1>
        <p className="text-mute">So games can see it&apos;s you playing.</p>
        <Link href="/dashboard/roblox" className="btn">Link account</Link>
      </div>
    );
  }

  await expireStaleTasks();
  await payPlayed({ playerId: user.id });
  const [queue, started] = await Promise.all([
    playQueue(user.id),
    db.playTask.findMany({
      where: { playerId: user.id, status: "PENDING" },
      include: { game: { select: { name: true, iconUrl: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Play &amp; earn</p>
          <h1 className="mt-1 page-title">Play {mins} min, get +1 credit</h1>
          <p className="mt-1 text-sm text-mute">Playing as <b className="text-cream">{user.robloxUsername}</b></p>
        </div>
        <Link href="/play/tasks" className="btn-quiet"><ListChecks className="h-4 w-4" /> My progress</Link>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}

      {started.length > 0 && (
        <section aria-labelledby="started-title" className="space-y-3">
          <h2 id="started-title" className="h-section">Started <span className="text-mute tabular-nums">{started.length}</span></h2>
          <ul className="divide-y divide-line border-y border-line">
            {started.map((t) => (
              <li key={t.id} className="flex items-center gap-4 py-3">
                <GameIcon url={t.game.iconUrl} className="h-12 w-12 shrink-0 rounded-ctl" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{t.game.name}</div>
                  <div className="text-xs text-mute tabular-nums">
                    {Math.floor(t.playedSeconds / 60)}/{mins} min played
                  </div>
                </div>
                <Link href="/play/tasks" className="btn min-h-[36px]">Continue</Link>
                <AbandonButton taskId={t.id} name={t.game.name} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {started.length > 0 && <h2 className="h-section">New games</h2>}
      {queue.length === 0 ? (
        <p className="py-14 text-center text-mute">No games need players right now. New ones arrive all the time.</p>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {queue.map((c) => (
            <li key={c.id} className="flex items-center gap-4 py-4">
              <GameIcon url={c.game.iconUrl} className="h-16 w-16 shrink-0 rounded-ctl" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{c.game.name}</div>
                <div className="flex items-center gap-2 text-xs text-mute">
                  {c.game.genre}
                  {isVerifiedGame(c.game) && <span className="inline-flex items-center gap-1 text-cream"><BadgeCheck className="h-3.5 w-3.5" /> Verified</span>}
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
