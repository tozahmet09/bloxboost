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
  /** The owner still has player slots, so playing it earns a credit. */
  earns?: boolean;
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
            {game.iconUrl ? (
              <GameIcon url={game.iconUrl} className="aspect-square h-1/2 rounded-ctl" />
            ) : (
              <span aria-hidden className="line-clamp-2 select-none px-4 text-center font-display leading-[.95] text-[clamp(18px,1.9vw,26px)] font-bold tracking-[-0.03em] text-white/[.07]">{game.name}</span>
            )}
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
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-faint">
      <span>{game.genre}</span>
      <span aria-hidden>·</span>
      <span className="inline-flex items-center gap-1 tabular-nums">
        <Users className="h-3 w-3" /> {game.playing.toLocaleString()}
      </span>
      {!!game.likes && (
        <>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1 tabular-nums">
            <Heart className="h-3 w-3" /> {game.likes.toLocaleString()}
          </span>
        </>
      )}
      {game.verified && (
        <span className="inline-flex items-center text-mute" title="Verified: in-game tracker installed">
          <BadgeCheck className="h-3.5 w-3.5" aria-label="Verified" />
        </span>
      )}
    </div>
  );
}

/** Game tile: 16:9 trailer, title and one line of facts underneath. The thumbnail is the only shape (it is clickable). */
export function TrailerCard({ game, href }: { game: TrailerGame; featured?: boolean; href?: string }) {
  const { ref, active } = useAutoplay(game.id, game.trailer);
  return (
    <a ref={ref} href={href ?? `/games/${game.id}`} className="group block min-w-0">
      <div className="relative aspect-video overflow-hidden rounded-media bg-panel">
        <div className="absolute inset-0 transition duration-300 ease-out group-hover:scale-[1.03] group-hover:brightness-110">
          <Media game={game} active={active} />
        </div>
        {game.earns && <span className="chip absolute left-2 top-2 bg-marquee text-ink">+1 credit</span>}
      </div>
      <div className="mt-2.5 flex gap-2">
        {game.rank && <span className="font-display text-sm font-bold tabular-nums text-faint">{game.rank}</span>}
        <div className="min-w-0 space-y-0.5">
          <div className="truncate text-sm font-semibold transition group-hover:text-marquee">{game.name}</div>
          <Meta game={game} />
        </div>
      </div>
    </a>
  );
}

/** One big featured trailer. The gradient at the bottom only exists to keep the title readable. */
export function Spotlight({ game }: { game: TrailerGame }) {
  const { ref, active } = useAutoplay(game.id, game.trailer);
  return (
    <a ref={ref} href={`/games/${game.id}`} className="group relative block overflow-hidden rounded-media bg-panel">
      <div className="relative aspect-video lg:aspect-[21/8]">
        <Media game={game} active={active} />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/95 via-ink/50 to-transparent px-4 pb-4 pt-20 sm:px-6 sm:pb-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="eyebrow text-mute">Featured</p>
              <div className="mt-1 truncate font-display text-2xl font-bold tracking-[-0.02em] sm:text-[32px]">{game.name}</div>
              <div className="mt-1"><Meta game={game} /></div>
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

/** Same tile, pointing somewhere else (e.g. /play) and always showing the +1 credit tag. */
export function EarnRow({ game, href }: { game: TrailerGame; href: string }) {
  return <TrailerCard game={{ ...game, earns: true }} href={href} />;
}
