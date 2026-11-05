"use client";

import { useEffect, useRef, useState } from "react";
import { BadgeCheck, Heart, Play, Users } from "lucide-react";
import type { Trailer } from "@/lib/trailer";
import { GameIcon } from "./GameIcon";

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
  /** Has the in-game tracker script installed. */
  verified?: boolean;
  likes?: number;
  /** Shown as a rank badge on leaderboard rows of cards. */
  rank?: number;
};

function useAutoplay(id: string, t: Trailer | null) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [active, setActive] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !t || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let visible = false;
    const tryPlay = () => {
      if (!visible) return;
      if (playing.size < MAX_PLAYING || playing.has(id)) {
        playing.add(id);
        setActive(true);
      } else waiting.push(tryPlay);
    };
    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.intersectionRatio >= 0.6;
        if (visible) tryPlay();
        else {
          setActive(false);
          release(id);
        }
      },
      { threshold: [0, 0.6] },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      release(id);
    };
  }, [id, t]);
  return { ref, active };
}

function Media({ game, active }: { game: TrailerGame; active: boolean }) {
  const t = game.trailer;
  const poster = t?.kind === "youtube" ? `https://i.ytimg.com/vi/${t.id}/hqdefault.jpg` : null;
  return (
    <>
      {poster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" onError={(e) => (e.currentTarget.hidden = true)} />
      ) : (
        <>
          {game.iconUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={game.iconUrl} alt="" className="absolute inset-0 h-full w-full scale-125 object-cover opacity-35 blur-2xl" />
          )}
          <div className="absolute inset-0 flex items-center justify-center">
            <GameIcon url={game.iconUrl} className="aspect-square h-1/2 rounded-ctl shadow-2xl" />
          </div>
        </>
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
    </>
  );
}

function Meta({ game }: { game: TrailerGame }) {
  return (
    <div className="flex items-center gap-2 text-xs text-mute">
      <span>{game.genre}</span>
      <span aria-hidden>·</span>
      <span className="inline-flex items-center gap-1 tabular-nums">
        <Users className="h-3.5 w-3.5" /> {game.playing.toLocaleString()} playing
      </span>
      {!!game.likes && (
        <>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1 tabular-nums">
            <Heart className="h-3.5 w-3.5" /> {game.likes.toLocaleString()}
          </span>
        </>
      )}
      {game.verified && (
        <>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1 text-verified">
            <BadgeCheck className="h-3.5 w-3.5" /> Verified
          </span>
        </>
      )}
    </div>
  );
}

/** Grid tile: trailer on top, title underneath. */
export function TrailerCard({ game, featured }: { game: TrailerGame; featured?: boolean }) {
  const { ref, active } = useAutoplay(game.id, game.trailer);
  return (
    <a ref={ref} href={`/games/${game.id}`} className="group block">
      <div className="relative aspect-video overflow-hidden rounded-media bg-panel ring-1 ring-line transition group-hover:ring-2 group-hover:ring-marquee">
        <Media game={game} active={active} />
        {featured && <span className="chip absolute left-2 top-2 bg-velvet text-cream">Featured</span>}
        {game.rank && <span className="chip absolute left-2 top-2 bg-marquee font-bold text-ink tabular-nums">#{game.rank}</span>}
        {!game.trailer && <span className="chip absolute bottom-2 right-2 bg-ink/70 text-mute">No trailer yet</span>}
        <span className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-marquee text-ink shadow-lg">
            <Play className="ml-0.5 h-5 w-5 fill-current" />
          </span>
        </span>
      </div>
      <div className="mt-2.5 space-y-0.5">
        <div className="truncate font-semibold group-hover:text-marquee">{game.name}</div>
        <Meta game={game} />
      </div>
    </a>
  );
}

/** The big trailer at the top of the homepage. */
export function Spotlight({ game }: { game: TrailerGame }) {
  const { ref, active } = useAutoplay(game.id, game.trailer);
  return (
    <a ref={ref} href={`/games/${game.id}`} className="group relative block overflow-hidden rounded-media bg-panel ring-1 ring-line">
      <div className="relative aspect-video lg:aspect-[21/9]">
        <Media game={game} active={active} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(18,15,23,.75)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink via-ink/60 to-transparent px-4 pb-4 pt-16 sm:px-6 sm:pb-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <span className="chip mb-2 bg-velvet text-cream">Featured</span>
              <div className="truncate font-display text-2xl font-extrabold sm:text-4xl">{game.name}</div>
              <Meta game={game} />
            </div>
            <span className="btn shrink-0">
              <Play className="h-4 w-4 fill-current" /> Watch &amp; play
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}
