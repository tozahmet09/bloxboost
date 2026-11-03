import { GOAL_PLAYERS } from "@/lib/money";

/** Progress toward a game's first 100 verified players. */
export function GoalBar({ count, compact }: { count: number; compact?: boolean }) {
  const pct = Math.min(100, (count / GOAL_PLAYERS) * 100);
  const done = count >= GOAL_PLAYERS;
  return (
    <div className={compact ? "w-full" : "w-full max-w-md"}>
      <div className="mb-1.5 flex items-baseline justify-between text-xs text-mute">
        <span>
          <b className={`font-display text-cream tabular-nums ${compact ? "text-sm" : "text-lg"}`}>{count}</b> / {GOAL_PLAYERS} verified players
        </span>
        {done && <span className="text-verified">Goal reached</span>}
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-line">
        <div className={`h-full rounded-full ${done ? "bg-verified" : "bg-marquee"} transition-[width] duration-700`} style={{ width: `${Math.max(pct, count ? 2 : 0)}%` }} />
      </div>
    </div>
  );
}
