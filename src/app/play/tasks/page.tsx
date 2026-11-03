import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { expireStaleTasks } from "@/lib/credits";
import { REQUIRED_SECONDS, TASK_TTL_HOURS } from "@/lib/money";
import { robloxGameUrl } from "@/lib/roblox";
import { GameIcon } from "@/components/GameCard";
import { Form } from "@/components/Form";
import { submitFeedback } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function Tasks({ searchParams }: { searchParams: Promise<{ started?: string }> }) {
  const user = await requireUser();
  const { started } = await searchParams;
  await expireStaleTasks();
  const tasks = await db.playTask.findMany({
    where: { playerId: user.id },
    include: { game: true },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  const mins = Math.round(REQUIRED_SECONDS / 60);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center">
        <h1 className="text-2xl font-bold">My games</h1>
        <Link href="/play" className="btn-ghost ml-auto">Find more games</Link>
      </div>
      {started && (
        <div className="rounded-xl bg-brand/10 p-4 text-sm">
          Game reserved for you. Open it on Roblox and play for {mins} minutes as <b>{user.robloxUsername}</b>.{" "}
          <a href={robloxGameUrl(started)} target="_blank" rel="noopener" className="font-semibold text-brand underline">Open in Roblox →</a>
          <div className="mt-1 text-xs text-slate-400">Refresh this page afterwards to leave feedback. You have {TASK_TTL_HOURS} hours.</div>
        </div>
      )}
      {tasks.length === 0 && <p className="text-slate-400">You haven&apos;t played anything yet.</p>}
      {tasks.map((t) => {
        const pct = Math.min(100, Math.round((t.playedSeconds / REQUIRED_SECONDS) * 100));
        return (
          <div key={t.id} className="card p-4">
            <div className="flex items-center gap-4">
              <GameIcon url={t.game.iconUrl} className="h-12 w-12 rounded-lg" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{t.game.name}</div>
                <div className="text-xs text-slate-400">
                  {t.status === "PENDING" && `Played ${Math.floor(t.playedSeconds / 60)} of ${mins} min`}
                  {t.status === "PLAYED" && "Done playing. Leave feedback to get your credit"}
                  {t.status === "COMPLETED" && "✅ +1 credit earned"}
                  {t.status === "EXPIRED" && "Expired (not enough playtime)"}
                </div>
              </div>
              {t.status === "PENDING" && (
                <a href={robloxGameUrl(t.game.placeId)} target="_blank" rel="noopener" className="btn-ghost text-sm">Play</a>
              )}
            </div>
            {t.status === "PENDING" && (
              <div className="mt-3 h-2 overflow-hidden rounded bg-slate-800">
                <div className="h-full bg-brand" style={{ width: `${pct}%` }} />
              </div>
            )}
            {t.status === "PLAYED" && (
              <div className="mt-4">
                <Form action={submitFeedback} submit="Send feedback (+1 ⭐)">
                  <input type="hidden" name="taskId" value={t.id} />
                  <div className="flex gap-3 text-sm">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <label key={n} className="flex items-center gap-1">
                        <input type="radio" name="rating" value={n} required /> {"★".repeat(n)}
                      </label>
                    ))}
                  </div>
                  <textarea name="feedback" rows={3} required minLength={20} className="input"
                    placeholder="What was fun? What was confusing? What would make you come back?" />
                </Form>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
