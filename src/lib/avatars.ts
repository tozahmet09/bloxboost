import "server-only";

type Kind = "avatar-headshot" | "avatar";

/**
 * Roblox avatar pictures for linked accounts, keyed by Roblox user id.
 * "avatar-headshot" = the head, "avatar" = full body. Cached for an hour, never throws:
 * if Roblox is slow, rows just show without a picture.
 */
export async function robloxAvatars(userIds: (string | null | undefined)[], kind: Kind = "avatar-headshot"): Promise<Map<string, string>> {
  const ids = [...new Set(userIds.filter((x): x is string => !!x && /^\d+$/.test(x)))];
  const out = new Map<string, string>();
  const size = kind === "avatar" ? "420x420" : "150x150";
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    try {
      const r = await fetch(`https://thumbnails.roblox.com/v1/users/${kind}?userIds=${chunk.join(",")}&size=${size}&format=Png&isCircular=false`, {
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(5000),
      });
      if (!r.ok) continue;
      const data: { targetId: number; state: string; imageUrl: string | null }[] = (await r.json()).data ?? [];
      for (const d of data) if (d.state === "Completed" && d.imageUrl) out.set(String(d.targetId), d.imageUrl);
    } catch {
      // Roblox slow or down: no picture this time.
    }
  }
  return out;
}
