"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteGame } from "@/app/actions";

/** Two-step: first click asks, second click deletes the game from SpawnSwap for good. */
export function DeleteGameButton({ gameId, name }: { gameId: string; name: string }) {
  const [asking, setAsking] = useState(false);
  if (!asking)
    return (
      <button type="button" onClick={() => setAsking(true)} className="inline-flex min-h-[40px] items-center gap-2 rounded-ctl border border-danger/60 px-4 text-sm font-semibold text-danger transition hover:bg-danger/10">
        <Trash2 className="h-4 w-4" /> Delete game
      </button>
    );
  return (
    <form action={deleteGame} className="flex flex-wrap items-center gap-2" role="alert">
      <input type="hidden" name="gameId" value={gameId} />
      <span className="text-sm text-danger">Delete {name} from SpawnSwap? This can&apos;t be undone.</span>
      <button className="min-h-[40px] rounded-ctl bg-danger px-4 text-sm font-semibold text-navy transition hover:opacity-90">Delete for good</button>
      <button type="button" onClick={() => setAsking(false)} className="min-h-[40px] px-2 text-sm text-mute hover:text-cream">Keep</button>
    </form>
  );
}
