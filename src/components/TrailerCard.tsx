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
  /** Wide 16:9 Roblox screenshot. */
  thumb?: string | null;
  /** One or two lines from the game's description, for the homepage hero. */
  pitch?: string;
  /** Gives the thumbnail a view-transition name so it grows into the game page. Only one card per game may have it. */
  vt?: boolean;
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

/** Still image for a game: the Roblox 16:9 screenshot, else the trailer's poster, else null. */
export function stillOf(game: TrailerGame) {
  const t = game.trailer;
  return game.thumb ?? (t?.kind === "youtube" ? `https://i.ytimg.com/vi/${t.id}/maxresdefault.jpg` : null);
}

/** Fades in once loaded. Loaded-ness lives in state (not a DOM class) so re-renders can't hide it again. */
function Still({ src, priority }: { src: string; priority?: boolean }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
      loading={priority ? "eager" : "lazy"}
      onLoad={() => setLoaded(true)}
      ref={(el) => { if (el?.complete && el.naturalWidth && !loaded) setLoaded(true); }}
      onError={() => setFailed(true)}
    />
  );
}

export function Media({ game, active, priority }: { game: TrailerGame; active: boolean; priority?: boolean }) {
  const t = game.trailer;
  const still = stillOf(game);
  const [narrow, setNarrow] = useState(false);
  return (
    <>
      {still ? (
        <Still src={still} priority={priority} />
      ) : t?.kind === "video" ? (
        // Uploaded trailer and no screenshot: its first frame is the still.
        <video className="absolute inset-0 h-full w-full object-cover" src={`${t.src}#t=0.1`} muted playsInline preload="metadata" />
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
              <span aria-hidden className="line-clamp-2 select-none px-4 text-center font-display text-[clamp(18px,1.9vw,26px)] font-bold leading-[.95] tracking-[-0.03em] text-white/[.07]">{game.name}</span>
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
      {active && t?.kind === "video" && !(still && narrow) && (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={t.src}
          autoPlay
          muted
          loop
          playsInline
          // A square or portrait clip (e.g. a phone recording) cropped into a wide frame is a blurry sliver: show the screenshot instead.
          onLoadedMetadata={(e) => setNarrow(e.currentTarget.videoWidth / e.currentTarget.videoHeight < 1.4)}
        />
      )}
    </>
  );
}

function Meta({ game }: { game: TrailerGame }) {
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 font-mono text-xs text-faint">
      <span className="font-body">{game.genre}</span>
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

/**
 * Game tile: 16:9 still (trailer plays when in view), name and one line of facts underneath.
 * The thumbnail is the only shape (it is clickable). On hover it lifts with a soft two-layer shadow.
 * Corners are concentric: 12px tile, 6px inset, so the +1 tag gets 6px.
 */
export function TrailerCard({ game, href }: { game: TrailerGame; href?: string }) {
  const { ref, active } = useAutoplay(game.id, game.trailer);
  return (
    <a ref={ref} href={href ?? `/games/${game.id}`} className="group block min-w-0">
      <div
        className="relative aspect-video overflow-hidden rounded-media bg-panel transition duration-200 ease-out group-hover:-translate-y-1 group-hover:shadow-lift"
        style={game.vt ? { viewTransitionName: `game-${game.id}` } : undefined}
      >
        <div className="absolute inset-0 transition duration-300 ease-out group-hover:scale-[1.04] group-hover:brightness-110">
          <Media game={game} active={active} />
        </div>
        {game.earns && <span className="absolute left-1.5 top-1.5 rounded-[6px] bg-coral px-1.5 py-0.5 font-mono text-[11px] font-medium text-navy">+1 credit</span>}
      </div>
      <div className="mt-2.5 flex gap-2.5">
        {game.rank && <span className="font-mono text-lg leading-none tabular-nums text-faint">{game.rank}</span>}
        <div className="min-w-0 space-y-0.5">
          <div className="truncate text-sm font-semibold transition group-hover:text-coral">{game.name}</div>
          <Meta game={game} />
        </div>
      </div>
    </a>
  );
}

/** Same tile, pointing somewhere else (e.g. /play) and always showing the +1 credit tag. */
export function EarnRow({ game, href }: { game: TrailerGame; href: string }) {
  return <TrailerCard game={{ ...game, earns: true }} href={href} />;
}

const HERO_MS = 7000;

/**
 * Full-bleed homepage hero: the featured game's trailer/screenshot IS the background (its world),
 * a blurred copy of it tints the page behind (ambient light), one primary action, and a strip of
 * up to 5 games on the right that rotates every 7s (pauses on hover, off with reduced motion).
 */
export function ImmersiveHero({ games }: { games: TrailerGame[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [trailerOn, setTrailerOn] = useState(false);
  const g = games[i];

  useEffect(() => setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches), []);
  useEffect(() => {
    if (paused || reduced || games.length < 2) return;
    const t = setTimeout(() => setI((x) => (x + 1) % games.length), HERO_MS);
    return () => clearTimeout(t);
  }, [i, paused, reduced, games.length]);
  // Start the trailer a moment after the still is shown, so switching games feels calm.
  useEffect(() => {
    setTrailerOn(false);
    if (reduced) return;
    const t = setTimeout(() => setTrailerOn(true), 900);
    return () => clearTimeout(t);
  }, [i, reduced]);

  const still = stillOf(g);
  const playHref = g.earns ? "/play" : `/games/${g.id}`;

  return (
    <section
      aria-label="Featured games"
      className="relative left-1/2 w-screen -translate-x-1/2"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Ambient light: a blurred copy of the game spills onto the page under the hero. */}
      {still && (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={`amb-${g.id}`} src={still} alt="" aria-hidden className="pointer-events-none absolute inset-x-0 top-[35%] -z-10 h-[110%] w-full animate-fade object-cover opacity-30 blur-[90px] saturate-150 [mask-image:linear-gradient(to_bottom,transparent,black_35%,transparent)]" />
      )}
      <div className="relative h-[min(78vh,560px)] min-h-[440px] overflow-hidden sm:h-[min(74vh,600px)]">
        {/* The picture fades out at the bottom (mask, not a navy overlay) so the ambient light below continues it without a seam. */}
        <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,black_72%,transparent)]">
          <div key={g.id} className="absolute inset-0 animate-fade">
            <Media game={g} active={trailerOn} priority />
          </div>
          <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-navy/90 via-navy/35 to-navy/0" />
          <div aria-hidden className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-navy/70 to-navy/0" />
        </div>

        <div className="relative mx-auto flex h-full max-w-6xl flex-col justify-end px-4 pb-10 sm:pb-14 lg:pb-16">
          <div key={`t-${g.id}`} className="max-w-xl animate-rise-in">
            <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[.06em] text-cream/80">
              <span className={`h-1.5 w-1.5 rounded-full ${g.playing > 0 ? "bg-verified" : "bg-coral"}`} aria-hidden />
              {g.playing > 0 ? `${g.playing.toLocaleString()} playing now` : "New on Spawnswap"}
              {g.genre && g.genre !== "All" && <> · {g.genre}</>}
            </p>
            <h1 className="mt-3 text-[36px] font-semibold leading-[1] tracking-[-0.04em] sm:text-[48px]">
              <a href={`/games/${g.id}`} className="transition hover:text-cream/85">{g.name}</a>
            </h1>
            {g.pitch && <p className="mt-3 line-clamp-2 max-w-md text-[15px] text-cream/85 sm:text-base">{g.pitch}</p>}
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
              <a href={playHref} className="btn h-11 px-5 text-[15px] shadow-lift">
                <Play className="h-4 w-4 fill-current" /> {g.earns ? "Play · earn 1 credit" : "Play"}
              </a>
              <a href={`/games/${g.id}`} className="link text-cream/80">Watch trailer</a>
            </div>
          </div>
        </div>

        {games.length > 1 && (
          <div className="absolute bottom-14 right-[max(1rem,calc((100vw-72rem)/2+1rem))] hidden gap-2.5 lg:flex lg:bottom-16">
            {games.map((x, k) => {
              const s = stillOf(x);
              const on = k === i;
              return (
                <button
                  key={x.id}
                  type="button"
                  onClick={() => setI(k)}
                  aria-label={`Show ${x.name}`}
                  aria-current={on}
                  className={`group w-28 text-left transition duration-200 ease-out hover:-translate-y-0.5 ${on ? "opacity-100" : "opacity-55 hover:opacity-100"}`}
                >
                  <span className={`relative block aspect-video overflow-hidden rounded-[8px] bg-panel ring-offset-2 ring-offset-navy ${on ? "ring-2 ring-cream" : ""}`}>
                    {s ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <GameIcon url={x.iconUrl} className="absolute inset-0 h-full w-full" />
                    )}
                  </span>
                  <span className="mt-2 block h-0.5 overflow-hidden rounded-full bg-cream/20">
                    {on && (
                      <span
                        key={`${x.id}-${paused}`}
                        className="block h-full bg-cream"
                        style={{ animation: paused || reduced ? "none" : `fill ${HERO_MS}ms linear forwards`, width: paused || reduced ? "100%" : undefined }}
                      />
                    )}
                  </span>
                  <span className="mt-1.5 block truncate text-xs text-cream/85">{x.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
