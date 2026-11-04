"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** While the player has a script-free game going, ask the server to check Roblox presence every minute. */
export function PresencePoller() {
  const router = useRouter();
  useEffect(() => {
    let stop = false;
    const tick = async () => {
      try {
        const r = await fetch("/api/presence", { method: "POST" });
        if (!stop && r.ok && (await r.json()).counted) router.refresh();
      } catch {
        // offline for a moment: try again next minute
      }
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [router]);
  return null;
}
