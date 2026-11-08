import Link from "next/link";
import { CheckCircle2, ExternalLink, Ticket } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { expireStaleTasks, isVerifiedGame } from "@/lib/credits";
import { REQUIRED_SECONDS } from "@/lib/money";
import { robloxGameUrl } from "@/lib/roblox";
import { GameIcon } from "@/components/GameIcon";
import { Form } from "@/components/Form";
import { Burst } from "@/components/Burst";
import { PresencePoller } from "@/components/PresencePoller";
import { StarPicker } from "@/components/StarPicker";
import { submitFeedback } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function Tasks({ searchParams }: { searchParams: Promise<{ started?: string }> }) {
  const user = await requireUser();
  const { started } = await searchParams;
  await expireStaleTasks();
  const tasks = await db.playTask.findMany({
    where: { playerId: user.id, status: { not: "EXPIRED" } },
    include: { game: true },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  const mins = Math.round(REQUIRED_SECONDS / 60);
  const justNow = Date.now() - 15_000;
  // Only show the "open in Roblox" banner while that game still needs playtime.
  const startedOpen = started && tasks.some((t) => t.game.placeId === started && t.status === "PENDING");
  // Games without the tracker script are timed by checking the player's Roblox status from this page.
  const watching = tasks.some((t) => t.status === "PENDING" && !isVerifiedGame(t.game));

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">My progress</p>
          <h1 className="mt-1 page-title">Games you&apos;re playing</h1>
        </div>
        <Link href="/play" className="btn-quiet">Find more</Link>
      </div>

      {watching && <PresencePoller />}
      {watching && (
        <p className="notice">
          Keep this page open while you play (a phone works too). We check your Roblox status every minute, so minutes only count while you&apos;re in the game.
        </p>
      )}

      {startedOpen && (
        <div className="flex flex-wrap items-center gap-4 border-l-2 border-marquee py-1 pl-4">
          <p className="min-w-0 flex-1 text-sm">
            Saved for you. Play {mins} min as <b>{user.robloxUsername}</b>, then come back to review.
          </p>
          <a href={robloxGameUrl(started!)} target="_blank" rel="noopener" className="btn">Open in Roblox <ExternalLink className="h-4 w-4" /></a>
        </div>
      )}

      {tasks.length === 0 && <p className="text-mute">Nothing yet. <Link href="/play" className="text-marquee underline">Pick a game</Link>.</p>}

      <ul className="divide-y divide-line border-y border-line">
        {tasks.map((t) => {
          const pct = Math.min(100, Math.round((t.playedSeconds / REQUIRED_SECONDS) * 100));
          return (
            <li key={t.id} className="space-y-4 py-5">
              <div className="flex items-center gap-4">
                <GameIcon url={t.game.iconUrl} className="h-12 w-12 shrink-0 rounded-ctl" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{t.game.name}</div>
                  {t.status === "PENDING" && (
                    <div className="mt-2 flex items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                        <div className="h-full rounded-full bg-marquee transition-[width] duration-700" style={{ width: `${Math.max(pct, 3)}%` }} />
                      </div>
                      <span className="text-xs text-mute tabular-nums">{Math.floor(t.playedSeconds / 60)}/{mins} min</span>
                    </div>
                  )}
                  {t.status === "PLAYED" && <div className="text-sm text-marquee">Done playing. How was it?</div>}
                  {t.status === "COMPLETED" && (
                    <div className="inline-flex items-center gap-1.5 text-sm text-verified"><CheckCircle2 className="h-4 w-4" /> Reviewed</div>
                  )}
                </div>
                {t.status === "PENDING" && (
                  <a href={robloxGameUrl(t.game.placeId)} target="_blank" rel="noopener" className="btn-quiet">Play</a>
                )}
                {t.status === "COMPLETED" && (
                  <span className="inline-flex items-center gap-1 text-sm text-mute"><Ticket className="h-4 w-4 text-marquee" /> +1</span>
                )}
              </div>
              {t.status === "COMPLETED" && t.completedAt && t.completedAt.getTime() > justNow && <Burst label="+1 credit" />}
              {t.status === "PLAYED" && (
                <Form action={submitFeedback} submit={<><Ticket className="h-4 w-4" /> Send review, get +1</>} className="space-y-3">
                  <input type="hidden" name="taskId" value={t.id} />
                  <StarPicker name="rating" />
                  <textarea name="feedback" aria-label="Your review" rows={3} required minLength={20} className="input" placeholder="What was fun? What was confusing?" />
                </Form>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
