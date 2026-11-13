"use client";

import { startTransition, useActionState } from "react";
import { rateGame } from "@/app/actions";
import { StarPicker } from "./StarPicker";

/** Uber-style: the credit is already paid. Rate with stars (words optional), or skip. */
export function RateForm({ taskId, game }: { taskId: string; game: string }) {
  const [state, action, pending] = useActionState(rateGame, undefined);
  if (state?.ok) return <p className="text-sm text-verified">{state.ok}</p>;
  const send = (fd: FormData) => startTransition(() => action(fd));
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        send(new FormData(e.currentTarget));
      }}
      className="space-y-3"
    >
      <input type="hidden" name="taskId" value={taskId} />
      <p className="text-sm">How was <b>{game}</b>?</p>
      <StarPicker name="rating" />
      <textarea name="feedback" aria-label="Feedback (optional)" rows={2} maxLength={2000} className="input" placeholder="Anything for the dev? (optional)" />
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <button className="btn" disabled={pending}>{pending ? "Sending…" : "Send rating"}</button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            const fd = new FormData();
            fd.set("taskId", taskId);
            fd.set("skip", "1");
            send(fd);
          }}
          className="link"
        >
          Skip
        </button>
        <span className="text-xs text-faint">Shows on the game&apos;s page.</span>
      </div>
    </form>
  );
}
