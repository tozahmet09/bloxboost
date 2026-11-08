import "server-only";
import { execFile } from "child_process";
import { mkdtemp, readFile, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { promisify } from "util";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import ffmpegPath from "ffmpeg-static";
import { parseTrailer, TRAILER_MAX_MB, TRAILER_MAX_SECONDS, TRAILER_MIN_SECONDS } from "./trailer";

const run = promisify(execFile);

/** What the check decided. `reason` is shown to the game's owner; `adminNote` only to admins. */
export type TrailerVerdict = {
  decision: "approve" | "review" | "reject";
  reason: string;
  adminNote?: string;
};

export const TRAILER_MIN_HEIGHT = 720;
const FRAMES = 6;
const MODEL = "claude-opus-5-5";

export const aiCheckOn = () => !!process.env.ANTHROPIC_API_KEY;

type Frame = { data: string; mediaType: "image/jpeg" };

/**
 * Checks a trailer before it goes on the homepage.
 * 1. Technical rules (uploaded/linked video files): 16:9, at least 720p, 5–35 seconds.
 * 2. AI look at a few frames: safe for kids, really a Roblox game, watchable quality.
 * Without ANTHROPIC_API_KEY only step 1 runs and everything that passes it is approved.
 */
export async function checkTrailer(url: string): Promise<TrailerVerdict> {
  const t = parseTrailer(url);
  if (!t) return { decision: "reject", reason: "That isn't a trailer link we can play." };

  let frames: Frame[];
  if (t.kind === "youtube") {
    const got = await youtubeFrames(t.id);
    if ("error" in got) return { decision: "reject", reason: got.error };
    frames = got.frames;
  } else {
    const got = await videoFrames(t.src);
    if ("error" in got) return { decision: "reject", reason: got.error };
    frames = got.frames;
  }

  if (!aiCheckOn()) return { decision: "approve", reason: "Passed the technical checks.", adminNote: "AI check is off (no ANTHROPIC_API_KEY)." };
  try {
    return await aiReview(frames, t.kind === "youtube");
  } catch (e) {
    // If the AI can't answer, a person decides. Never let an unchecked trailer through silently.
    return {
      decision: "review",
      reason: "We're taking a closer look at your trailer. This usually takes less than a day.",
      adminNote: `AI check failed: ${e instanceof Error ? e.message.slice(0, 200) : "unknown error"}`,
    };
  }
}

// ---------- frames ----------

/** YouTube makes four stills for every video. A missing video only has a tiny grey placeholder. */
async function youtubeFrames(id: string): Promise<{ frames: Frame[] } | { error: string }> {
  const ok = await fetch(`https://www.youtube.com/oembed?format=json&url=https://www.youtube.com/watch?v=${id}`, { cache: "no-store" })
    .then((r) => r.ok)
    .catch(() => true); // YouTube unreachable: don't blame the developer, the frames below will tell
  if (!ok) return { error: "That YouTube video is private, deleted or doesn't allow embedding. Make it Public or Unlisted with embedding on." };
  const frames: Frame[] = [];
  for (const name of ["hqdefault", "hq1", "hq2", "hq3"]) {
    const r = await fetch(`https://i.ytimg.com/vi/${id}/${name}.jpg`, { cache: "no-store" }).catch(() => null);
    if (!r?.ok) continue;
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > 2000) frames.push({ data: buf.toString("base64"), mediaType: "image/jpeg" });
  }
  if (!frames.length) return { error: "We couldn't load that YouTube video. Check the link and that the video is Public or Unlisted." };
  return { frames };
}

/** Downloads the video, checks its shape and length, and grabs evenly spaced stills with ffmpeg. */
async function videoFrames(src: string): Promise<{ frames: Frame[] } | { error: string }> {
  if (!ffmpegPath) throw new Error("ffmpeg is missing");
  const dir = await mkdtemp(join(tmpdir(), "trailer-"));
  try {
    const file = join(dir, "in");
    const r = await fetch(src, { cache: "no-store" }).catch(() => null);
    if (!r?.ok || !r.body) return { error: "We couldn't download that video. Check the link works in a private browser window." };
    const limit = TRAILER_MAX_MB * 1024 * 1024;
    if (Number(r.headers.get("content-length") ?? 0) > limit) return { error: `That video is over ${TRAILER_MAX_MB} MB.` };
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const c of r.body as unknown as AsyncIterable<Uint8Array>) {
      size += c.length;
      if (size > limit) return { error: `That video is over ${TRAILER_MAX_MB} MB.` };
      chunks.push(Buffer.from(c));
    }
    await writeFile(file, Buffer.concat(chunks));

    const info = await probe(file);
    if (!info) return { error: "We couldn't read that video. Export it as MP4 (H.264) and try again." };
    const { width: w, height: h, seconds } = info;
    if (seconds < TRAILER_MIN_SECONDS) return { error: `That clip is ${Math.round(seconds)} seconds. Make it at least 10.` };
    if (seconds > TRAILER_MAX_SECONDS) return { error: `That clip is ${Math.round(seconds)} seconds. Trim it to 30 seconds or less.` };
    if (h > w) return { error: "That video is vertical. Record or export it sideways (16:9), like 1920×1080." };
    if (Math.abs(w / h - 16 / 9) > 0.05) return { error: `That video is ${w}×${h}. Trailers need to be 16:9, like 1920×1080 or 1280×720.` };
    if (h < TRAILER_MIN_HEIGHT) return { error: `That video is ${w}×${h}. Export it at 720p (1280×720) or higher.` };

    const frames: Frame[] = [];
    for (let i = 0; i < FRAMES; i++) {
      const at = ((i + 0.5) * seconds) / FRAMES;
      const out = join(dir, `f${i}.jpg`);
      await run(ffmpegPath, ["-v", "error", "-ss", at.toFixed(2), "-i", file, "-frames:v", "1", "-vf", "scale=1280:-2", "-q:v", "4", "-y", out], { timeout: 30e3 });
      const buf = await readFile(out).catch(() => null);
      if (buf) frames.push({ data: buf.toString("base64"), mediaType: "image/jpeg" });
    }
    if (!frames.length) return { error: "We couldn't read that video. Export it as MP4 (H.264) and try again." };
    return { frames };
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

/** Reads size, rotation and length from ffmpeg's description of the file. */
async function probe(file: string) {
  // `ffmpeg -i` with no output exits with an error but still prints the stream info on stderr.
  const text: string = await run(ffmpegPath!, ["-hide_banner", "-i", file], { timeout: 30e3 }).then(
    (r) => r.stderr,
    (e) => String(e?.stderr ?? ""),
  );
  const dur = text.match(/Duration: (\d+):(\d+):(\d+(?:\.\d+)?)/);
  const size = text.match(/Stream #\d+:\d+[^\n]*Video:[^\n]*?\b(\d{2,5})x(\d{2,5})\b/);
  if (!dur || !size) return null;
  let width = Number(size[1]);
  let height = Number(size[2]);
  // Phone videos are often stored sideways with a "rotate 90" note.
  const rot = text.match(/rotation of (-?\d+(?:\.\d+)?) degrees/) ?? text.match(/rotate\s*:\s*(-?\d+)/);
  if (rot && Math.abs(Math.round(Number(rot[1]))) % 180 === 90) [width, height] = [height, width];
  return { width, height, seconds: Number(dur[1]) * 3600 + Number(dur[2]) * 60 + Number(dur[3]) };
}

// ---------- AI ----------

const Review = z.object({
  kid_safe: z.boolean().describe("True when nothing in the stills is unsuitable for children aged 9-13."),
  is_roblox_game: z.boolean().describe("True when the stills look like gameplay or footage of a Roblox experience."),
  watchable: z.boolean().describe("True when the stills are clear enough to show as an ad (not black, blank, frozen-looking, extremely blurry or only text)."),
  decision: z.enum(["approve", "review", "reject"]),
  reason_for_developer: z.string().describe("One or two short, friendly sentences in plain English telling the developer what to fix. Empty when approved."),
  note_for_admin: z.string().describe("One short sentence describing what you saw and why you decided this."),
});

const SYSTEM = `You check video trailers for Spawnswap, a site where Roblox developers advertise their games. Most viewers are children and teens, so trailers must follow Roblox's own community standards and be safe for ages 9-13.

You get a few evenly spaced still frames from one trailer. Decide:
- "reject" when something clearly breaks the rules: sexual or suggestive content, nudity, gore or realistic blood, real-world weapons or violence, drugs, alcohol, gambling or casino imagery, hate symbols or slurs, real people's personal info, scams (free Robux, giveaways that ask for passwords, links to other sites), or footage that clearly isn't a Roblox game (real-life video, another game, a slideshow of unrelated images). Also reject footage that is unwatchable: all black, blank, or only text with no gameplay.
- "review" when you are unsure: content that might be too violent or mature, text you can't read that might be a scam, frames that could be from another game, or anything a human should look at.
- "approve" otherwise. Cartoon combat, blocky weapons, horror-themed Roblox games without gore, and normal Roblox UI are fine. Low but acceptable quality is fine.

Only judge what you can see in the frames. Be fair to small developers: don't reject for style or taste.`;

let client: Anthropic | null = null;

async function aiReview(frames: Frame[], youtube: boolean): Promise<TrailerVerdict> {
  client ??= new Anthropic();
  const res = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 4000,
    // If the model declines to look, a fallback model answers instead of the check stopping.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "medium", format: betaZodOutputFormat(Review) },
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: [
          ...frames.map((f) => ({ type: "image" as const, source: { type: "base64" as const, media_type: f.mediaType, data: f.data } })),
          {
            type: "text",
            text: youtube
              ? `These are ${frames.length} stills YouTube made from the trailer (low resolution is normal). Check them.`
              : `These are ${frames.length} stills taken evenly across the trailer. Check them.`,
          },
        ],
      },
    ],
  });

  const out = res.stop_reason === "refusal" ? null : res.parsed_output;
  if (!out)
    return {
      decision: "review",
      reason: "We're taking a closer look at your trailer. This usually takes less than a day.",
      adminNote: res.stop_reason === "refusal" ? "The AI declined to judge these frames." : "The AI gave no usable answer.",
    };
  // Belt and braces: a "no" on any rule is never an approval.
  let decision = out.decision;
  if (decision === "approve" && (!out.kid_safe || !out.is_roblox_game || !out.watchable)) decision = "review";
  const reason =
    decision === "approve"
      ? "Trailer approved."
      : decision === "review"
        ? "We're taking a closer look at your trailer. This usually takes less than a day."
        : out.reason_for_developer.trim() || "This trailer doesn't meet our rules. Use real gameplay that's safe for kids.";
  return { decision, reason, adminNote: out.note_for_admin };
}
