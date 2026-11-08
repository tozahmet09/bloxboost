"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { Film, Link2, Upload, X } from "lucide-react";
import { setTrailer } from "@/app/actions";
import {
  parseTrailer,
  TRAILER_MAX_MB,
  TRAILER_MAX_SECONDS,
  TRAILER_MIN_SECONDS,
  TRAILER_TYPES,
} from "@/lib/trailer";

type Msg = { error?: string; ok?: string } | undefined;

/** Reads the video's length in the browser. Fails if the browser can't play the file. */
function videoSeconds(file: File) {
  return new Promise<number>((resolve, reject) => {
    const v = document.createElement("video");
    const url = URL.createObjectURL(file);
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(v.duration);
    };
    v.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("unplayable"));
    };
    v.src = url;
  });
}

async function checkFile(file: File): Promise<string | null> {
  if (!TRAILER_TYPES[file.type]) return "Pick an MP4, WebM or MOV video.";
  if (file.size > TRAILER_MAX_MB * 1024 * 1024) return `That file is ${Math.round(file.size / 1048576)} MB. The limit is ${TRAILER_MAX_MB} MB.`;
  let secs: number;
  try {
    secs = await videoSeconds(file);
  } catch {
    return "This video won't play in a browser. Export it as MP4 (H.264) and try again.";
  }
  if (!Number.isFinite(secs)) return null; // some recordings don't report a length; let them through
  if (secs < TRAILER_MIN_SECONDS) return `That clip is ${Math.round(secs)} seconds. Make it at least 10.`;
  if (secs > TRAILER_MAX_SECONDS) return `That clip is ${Math.round(secs)} seconds. Trim it to 30 seconds or less.`;
  return null;
}

export function TrailerUpload({ gameId, current, uploadsOn }: { gameId: string; current: string | null; uploadsOn: boolean }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [msg, setMsg] = useState<Msg>();
  const [showLink, setShowLink] = useState(() => !uploadsOn || parseTrailer(current)?.kind === "youtube");
  const [link, setLink] = useState(parseTrailer(current)?.kind === "youtube" ? current ?? "" : "");
  const [dragging, setDragging] = useState(false);
  const [saving, startSaving] = useTransition();
  const busy = progress !== null || saving;
  const trailer = parseTrailer(current);

  function save(url: string) {
    const fd = new FormData();
    fd.set("gameId", gameId);
    fd.set("trailerUrl", url);
    startSaving(async () => {
      const r = await setTrailer(undefined, fd);
      setMsg(r);
      if (r?.ok) router.refresh();
    });
  }

  async function send(file: File | undefined) {
    if (!file || busy) return;
    setMsg(undefined);
    const problem = await checkFile(file);
    if (problem) return setMsg({ error: problem });
    setProgress(0);
    try {
      const blob = await upload(`trailers/${gameId}.${TRAILER_TYPES[file.type]}`, file, {
        access: "public",
        handleUploadUrl: "/api/trailer/upload",
        clientPayload: gameId,
        contentType: file.type,
        multipart: file.size > 8 * 1024 * 1024,
        onUploadProgress: (p) => setProgress(Math.round(p.percentage)),
      });
      setProgress(null);
      save(blob.url);
    } catch (e) {
      setProgress(null);
      const text = e instanceof Error ? e.message : "";
      setMsg({
        error: /switched on|log in|not found/i.test(text)
          ? text.replace(/^Vercel Blob:\s*/i, "")
          : "Upload didn't finish. Check your connection and try again.",
      });
    } finally {
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      {trailer && (
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative aspect-video w-56 overflow-hidden rounded-ctl border border-line bg-panel">
            {trailer.kind === "video" ? (
              <video className="h-full w-full object-cover" src={trailer.src} muted loop playsInline autoPlay preload="metadata" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="h-full w-full object-cover" src={`https://i.ytimg.com/vi/${trailer.id}/hqdefault.jpg`} alt="" onError={(e) => (e.currentTarget.hidden = true)} />
            )}
          </div>
          <div className="space-y-2 text-sm">
            <p className="text-verified">{trailer.kind === "video" ? "Video trailer is live." : "YouTube trailer is live."}</p>
            <button type="button" className="btn-quiet text-sm" disabled={busy} onClick={() => save("")}>
              <X className="h-4 w-4" /> Remove
            </button>
          </div>
        </div>
      )}

      {!uploadsOn ? (
        <p className="text-sm text-mute">Video uploads are coming soon. For now, paste a YouTube link.</p>
      ) : (
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          send(e.dataTransfer.files[0]);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-ctl border border-dashed px-4 py-8 text-center transition ${
          dragging ? "border-coral bg-panel" : "border-line hover:border-mute"
        } ${busy ? "pointer-events-none opacity-70" : ""}`}
      >
        <input
          ref={input}
          type="file"
          accept={Object.keys(TRAILER_TYPES).join(",")}
          className="sr-only"
          disabled={busy}
          onChange={(e) => send(e.target.files?.[0])}
        />
        {progress !== null ? (
          <>
            <Film className="h-6 w-6 text-coral" />
            <span className="font-semibold">Uploading… {progress}%</span>
            <span className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-line">
              <span className="block h-full bg-coral transition-all" style={{ width: `${progress}%` }} />
            </span>
          </>
        ) : saving ? (
          <span className="font-semibold">Saving…</span>
        ) : (
          <>
            <Upload className="h-6 w-6 text-coral" />
            <span className="font-semibold">{trailer ? "Upload a new video" : "Upload your trailer"}</span>
            <span className="text-xs text-mute">
              Drop a file here or click. MP4, WebM or MOV, 10 to 30 seconds, up to {TRAILER_MAX_MB} MB.
            </span>
          </>
        )}
      </label>
      )}

      {msg?.error && <p className="text-sm text-danger">{msg.error}</p>}
      {msg?.ok && <p className="text-sm text-verified">{msg.ok}</p>}

      {showLink ? (
        <form
          className="flex flex-wrap items-start gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            setMsg(undefined);
            save(link.trim());
          }}
        >
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            aria-label="Trailer link"
            placeholder="YouTube link or .mp4 link"
            className="input min-w-0 flex-1 basis-64"
          />
          <button className="btn" disabled={busy}>
            {saving ? "Working…" : "Save link"}
          </button>
        </form>
      ) : (
        <button type="button" className="inline-flex items-center gap-1.5 text-sm text-mute hover:text-cream" onClick={() => setShowLink(true)}>
          <Link2 className="h-4 w-4" /> Or paste a YouTube link
        </button>
      )}
    </div>
  );
}
