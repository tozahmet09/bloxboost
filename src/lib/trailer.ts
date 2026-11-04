export type Trailer = { kind: "youtube"; id: string } | { kind: "video"; src: string };

// Uploaded trailer rules. Shared by the upload button (browser) and the upload route (server).
export const TRAILER_MAX_MB = 60;
export const TRAILER_MIN_SECONDS = 5;
export const TRAILER_MAX_SECONDS = 35; // we ask for 10–30s and allow a little slack
export const TRAILER_TYPES: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

/** Accepts YouTube watch/shorts/youtu.be links or a direct https .mp4/.webm/.mov file. */
export function parseTrailer(input: string | null | undefined): Trailer | null {
  if (!input) return null;
  const s = input.trim();
  const yt = s.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/i);
  if (yt) return { kind: "youtube", id: yt[1] };
  if (/^https:\/\/\S+\.(mp4|webm|mov)(\?\S*)?$/i.test(s)) return { kind: "video", src: s };
  return null;
}

/** True when the URL is a file we stored for this game (so we may delete it when it's replaced). */
export function isOwnUpload(url: string | null | undefined, gameId: string) {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.hostname.endsWith(".blob.vercel-storage.com") && u.pathname.startsWith(`/trailers/${gameId}`);
  } catch {
    return false;
  }
}

export function trailerPoster(t: Trailer | null) {
  return t?.kind === "youtube" ? `https://i.ytimg.com/vi/${t.id}/hqdefault.jpg` : null;
}
