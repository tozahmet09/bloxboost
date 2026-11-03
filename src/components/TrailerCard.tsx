"use client";

import { useEffect, useRef, useState } from "react";
import type { Trailer } from "@/lib/trailer";

// Only a couple of trailers play at once so the page stays fast on phones.
const MAX_PLAYING = 2;
const playing = new Set<string>();
const waiting: Array<() => void> = [];

function release(id: string) {
  if (playing.delete(id)) waiting.shift()?.();
}

export type TrailerGame = {
  id: string;
  name: string;
  genre: string;
  playing: number;
  iconUrl: string | null;
  trailer: Trailer | null;
};

export function TrailerCard({ game, featured, big }: { game: TrailerGame; featured?: boolean; big?: boolean }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [active, setActive] = useState(false);
  const t = game.trailer;
  const poster = t?.kind === "youtube" ? `https://i.ytimg.com/vi/${t.id}/hqdefault.jpg` : null;

  useEffect(() => {
    const el = ref.current;
    if (!el || !t || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let visible = false;
    const tryPlay = () => {
      if (!visible) return;
      if (playing.size < MAX_PLAYING || playing.has(game.id)) {
        playing.add(game.id);
        setActive(true);
      } else waiting.push(tryPlay);
    };
    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.intersectionRatio >= 0.6;
        if (visible) tryPlay();
        else {
          setActive(false);
          release(game.id);
        }
      },
      { threshold: [0, 0.6] },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      release(game.id);
    };
  }, [game.id, t]);

  return (
    <a
      ref={ref}
      href={`/go/${game.id}`}
      target="_blank"
      rel="noopener"
      className="card group block overflow-hidden transition hover:border-brand"
    >
      <div className={`relative aspect-video overflow-hidden bg-slate-900 ${big ? "lg:aspect-[21/9]" : ""}`}>
        {/* Resting frame: YouTube thumbnail, or the blurred game icon when there is no trailer */}
        {poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" onError={(e) => (e.currentTarget.hidden = true)} />
        ) : game.iconUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={game.iconUrl} alt="" className="absolute inset-0 h-full w-full scale-125 object-cover opacity-40 blur-2xl" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={game.iconUrl} alt="" className="absolute left-1/2 top-1/2 h-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl shadow-xl" />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-4xl">🎮</div>
        )}

        {active && t?.kind === "youtube" && (
          <iframe
            className="pointer-events-none absolute inset-0 h-full w-full scale-[1.35]"
            src={`https://www.youtube-nocookie.com/embed/${t.id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${t.id}&playsinline=1&rel=0&modestbranding=1`}
            allow="autoplay; encrypted-media"
            title={`${game.name} trailer`}
            tabIndex={-1}
          />
        )}
        {active && t?.kind === "video" && (
          <video className="absolute inset-0 h-full w-full object-cover" src={t.src} autoPlay muted loop playsInline />
        )}

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 to-transparent p-3 pt-10">
          <div className={`truncate font-bold ${big ? "text-2xl sm:text-3xl" : ""}`}>{game.name}</div>
          <div className="mt-0.5 flex gap-2 text-xs text-slate-300">
            <span>{game.genre}</span>
            <span>·</span>
            <span>{game.playing.toLocaleString()} playing</span>
          </div>
        </div>
        {featured && (
          <span className="absolute left-2 top-2 rounded-md bg-slate-950/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand">
            Featured
          </span>
        )}
        {!t && (
          <span className="absolute right-2 top-2 rounded-md bg-slate-950/70 px-2 py-0.5 text-[10px] text-slate-400">No trailer yet</span>
        )}
        <span className="absolute right-2 top-2 hidden rounded-md bg-brand px-2 py-1 text-xs font-bold text-slate-950 group-hover:block">
          Play ▶
        </span>
      </div>
    </a>
  );
}
