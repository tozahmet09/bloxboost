"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { abandonTask } from "@/app/actions";

/** Two-step: first click asks, second click drops the game. Progress resets; the game goes back to the credit list. */
export function AbandonButton({ taskId, name }: { taskId: string; name: string }) {
  const [asking, setAsking] = useState(false);
  if (!asking)
    return (
      <button type="button" onClick={() => setAsking(true)} aria-label={`Abandon ${name}`} className="inline-flex min-h-[36px] items-center gap-1 rounded-ctl px-2 text-sm text-mute transition hover:text-danger">
        <X className="h-4 w-4" /> Abandon
      </button>
    );
  return (
    <form action={abandonTask} className="flex flex-wrap items-center gap-2" role="alert">
      <input type="hidden" name="taskId" value={taskId} />
      <span className="text-xs text-danger">Your progress resets to 0. The game goes back to the credit list. Abandon?</span>
      <button className="min-h-[36px] rounded-ctl border border-danger px-3 text-sm font-semibold text-danger transition hover:bg-danger/10">Abandon</button>
      <button type="button" onClick={() => setAsking(false)} className="min-h-[36px] px-2 text-sm text-mute hover:text-cream">Keep</button>
    </form>
  );
}
