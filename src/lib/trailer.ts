export type Trailer = { kind: "youtube"; id: string } | { kind: "video"; src: string };

/** Accepts YouTube watch/shorts/youtu.be links or a direct https .mp4/.webm file. */
export function parseTrailer(input: string | null | undefined): Trailer | null {
  if (!input) return null;
  const s = input.trim();
  const yt = s.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/i);
  if (yt) return { kind: "youtube", id: yt[1] };
  if (/^https:\/\/\S+\.(mp4|webm)(\?\S*)?$/i.test(s)) return { kind: "video", src: s };
  return null;
}

export function trailerPoster(t: Trailer | null) {
  return t?.kind === "youtube" ? `https://i.ytimg.com/vi/${t.id}/hqdefault.jpg` : null;
}
