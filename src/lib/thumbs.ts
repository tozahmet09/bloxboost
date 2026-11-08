import "server-only";

/**
 * Wide 16:9 game thumbnails (the big screenshot on a Roblox game page), keyed by universe id.
 * Cached for an hour so the homepage doesn't call Roblox on every visit. Never throws:
 * if Roblox is down, cards just fall back to the game icon.
 */
export async function gameThumbnails(universeIds: (string | null | undefined)[]): Promise<Map<string, string>> {
  const ids = [...new Set(universeIds.filter((x): x is string => !!x && /^\d+$/.test(x)))];
  const out = new Map<string, string>();
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50);
    try {
      const r = await fetch(
        `https://thumbnails.roblox.com/v1/games/multiget/thumbnails?universeIds=${chunk.join(",")}&countPerUniverse=1&defaults=true&size=768x432&format=Png&isCircular=false`,
        { next: { revalidate: 3600 }, signal: AbortSignal.timeout(5000) },
      );
      if (!r.ok) continue;
      const data: { universeId: number; thumbnails?: { state: string; imageUrl: string | null }[] }[] = (await r.json()).data ?? [];
      for (const d of data) {
        const t = d.thumbnails?.find((x) => x.state === "Completed" && x.imageUrl);
        if (t?.imageUrl) out.set(String(d.universeId), t.imageUrl);
      }
    } catch {
      // Roblox slow or down: leave these without a thumbnail.
    }
  }
  return out;
}

/** Roblox shows "[TITLE UNAVAILABLE]"-style placeholders for games it hasn't cleared yet. Show something friendlier. */
export function displayName(name: string) {
  return /^\s*\[.*\]\s*$/.test(name) ? "Untitled game" : name;
}
