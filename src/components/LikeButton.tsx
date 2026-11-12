"use client";

import { Heart } from "lucide-react";
import { useOptimistic, startTransition } from "react";

/** Heart toggle. Updates instantly, then the server action catches up. */
export function LikeButton({
  liked,
  count,
  action,
  field,
  value,
  size = "md",
  label = "Like",
}: {
  liked: boolean;
  count: number;
  action: (f: FormData) => Promise<void>;
  field: string;
  value: string;
  size?: "sm" | "md";
  label?: string;
}) {
  const [s, set] = useOptimistic({ liked, count }, (cur) => ({ liked: !cur.liked, count: cur.count + (cur.liked ? -1 : 1) }));
  return (
    <form
      action={action}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          set(null);
          await action(fd);
        });
      }}
    >
      <input type="hidden" name={field} value={value} />
      <button
        aria-pressed={s.liked}
        aria-label={`${label} (${s.count})`}
        className={
          size === "md"
            ? `btn-quiet ${s.liked ? "border-lime text-lime" : ""}`
            : `inline-flex min-h-[36px] items-center gap-1.5 rounded-ctl px-2 text-xs ${s.liked ? "text-lime" : "text-mute hover:text-cream"}`
        }
      >
        <Heart className={`${size === "md" ? "h-4 w-4" : "h-3.5 w-3.5"} ${s.liked ? "fill-current" : ""}`} />
        <span className="tabular-nums">{s.count.toLocaleString()}</span>
      </button>
    </form>
  );
}
