"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";
import { addComment } from "@/app/actions";
import { COMMENT_MAX_CHARS } from "@/lib/money";

export function CommentForm({ gameId }: { gameId: string }) {
  const [state, action, pending] = useActionState(addComment, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);
  return (
    <form
      ref={ref}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
      className="space-y-2"
    >
      <input type="hidden" name="gameId" value={gameId} />
      <label htmlFor="body" className="sr-only">Comment</label>
      <textarea id="body" name="body" required minLength={2} maxLength={COMMENT_MAX_CHARS} rows={3} placeholder="What did you think? Tips for the dev?" className="input min-h-[88px] py-2.5" />
      <div className="flex items-center gap-3">
        <button className="btn" disabled={pending}>{pending ? "Posting…" : "Post comment"}</button>
        {state?.error && <p className="text-sm text-danger">{state.error}</p>}
        {state?.ok && <p className="text-sm text-verified">Posted.</p>}
      </div>
    </form>
  );
}
