// Helpers for reading public game info from Roblox's web APIs (no API key needed).

export function parsePlaceId(input: string): string | null {
  const s = input.trim();
  if (/^\d{3,20}$/.test(s)) return s;
  const m = s.match(/roblox\.com\/(?:[a-z-]+\/)?games\/(\d+)/i);
  return m ? m[1] : null;
}

export type RobloxGameInfo = {
  universeId: string;
  name: string;
  description: string;
  playing: number;
  visits: number;
  genre: string;
  iconUrl: string | null;
};

async function getJson(url: string) {
  const r = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error(`Roblox API ${r.status} for ${url}`);
  return r.json();
}

export async function fetchRobloxGame(placeId: string): Promise<RobloxGameInfo> {
  const { universeId } = await getJson(
    `https://apis.roblox.com/universes/v1/places/${placeId}/universe`,
  );
  if (!universeId) throw new Error("Place not found");
  const [details, icons] = await Promise.all([
    getJson(`https://games.roblox.com/v1/games?universeIds=${universeId}`),
    getJson(
      `https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeId}&size=512x512&format=Png&isCircular=false`,
    ).catch(() => ({ data: [] })),
  ]);
  const g = details.data?.[0];
  if (!g) throw new Error("Game details not found");
  return {
    universeId: String(universeId),
    name: g.name,
    description: g.description ?? "",
    playing: g.playing ?? 0,
    visits: g.visits ?? 0,
    genre: g.genre ?? "All",
    iconUrl: icons.data?.[0]?.imageUrl ?? null,
  };
}

export function robloxGameUrl(placeId: string) {
  return `https://www.roblox.com/games/${placeId}`;
}

/** Resolve a Roblox username to its user id. */
export async function lookupRobloxUser(username: string): Promise<{ id: string; name: string } | null> {
  const r = await fetch("https://users.roblox.com/v1/usernames/users", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ usernames: [username], excludeBannedUsers: true }),
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error(`Roblox API ${r.status}`);
  const u = (await r.json()).data?.[0];
  return u ? { id: String(u.id), name: u.name } : null;
}

/** Profile "About" text, used to verify account ownership with a one-time code. */
export async function robloxProfileDescription(userId: string): Promise<string> {
  const u = await getJson(`https://users.roblox.com/v1/users/${userId}`);
  return u.description ?? "";
}

export type Presence = { inGame: boolean; universeId: string | null };

/**
 * Online status of up to 50 users from Roblox's public presence API (no login needed).
 * Without a Roblox login cookie Roblox only says "in a game", not which one, so universeId is
 * usually null. If Roblox does return it, we use it to make sure it's the right game.
 */
export async function fetchPresence(userIds: string[]): Promise<Map<string, Presence>> {
  const out = new Map<string, Presence>();
  if (!userIds.length) return out;
  const r = await fetch("https://presence.roblox.com/v1/presence/users", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ userIds: userIds.slice(0, 50).map(Number) }),
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error(`Roblox presence API ${r.status}`);
  const data = (await r.json()).userPresences ?? [];
  for (const p of data) {
    out.set(String(p.userId), {
      inGame: p.userPresenceType === 2,
      universeId: p.universeId ? String(p.universeId) : null,
    });
  }
  return out;
}
