import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BadgeCheck, Clapperboard, Play, Star, Ticket, Users } from "lucide-react";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { parseTrailer } from "@/lib/trailer";
import { earningGameIds, isVerifiedGame } from "@/lib/credits";
import { robloxAvatars } from "@/lib/avatars";
import { publicName } from "@/lib/community";
import { playGame } from "@/app/actions";
import { GameIcon } from "@/components/GameIcon";
import { displayName, gameThumbnails } from "@/lib/thumbs";
import { isUpcoming, releaseLabel } from "@/lib/release";

export const dynamic = "force-dynamic";

const nameSel = { displayName: true, robloxUsername: true, robloxVerified: true } as const;
const devSel = { ...nameSel, robloxUserId: true, createdAt: true } as const;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const g = await db.game.findUnique({ where: { id }, select: { name: true, description: true, hiddenAt: true } });
  return g && !g.hiddenAt ? { title: displayName(g.name), description: g.description.slice(0, 160) } : {};
}

function ago(d: Date) {
  const m = Math.round((Date.now() - d.getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export default async function GamePublic({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUser();
  const game = await db.game.findUnique({
    where: { id },
    select: {
      id: true, name: true, description: true, universeId: true, genre: true, playing: true, visits: true, iconUrl: true, trailerUrl: true,
      scriptLastSeen: true, ownerId: true, releaseAt: true, hiddenAt: true, seriesTestedAt: true, seriesVideoUrl: true,
      owner: { select: devSel },
    },
  });
  if (!game || (game.hiddenAt && user?.id !== game.ownerId)) notFound();
  game.name = displayName(game.name);
  const done = { gameId: id, status: "COMPLETED" } as const;
  const [stats, byStars, reviews, earning, devGames] = await Promise.all([
    db.playTask.aggregate({ where: done, _count: { id: true }, _avg: { rating: true } }),
    db.playTask.groupBy({ by: ["rating"], where: { ...done, rating: { not: null } }, _count: { _all: true } }),
    db.playTask.findMany({
      where: { ...done, rating: { not: null } },
      orderBy: { completedAt: "desc" },
      take: 20,
      select: { id: true, rating: true, feedback: true, completedAt: true, player: { select: nameSel } },
    }),
    earningGameIds(),
    db.game.findMany({
      where: { ownerId: game.ownerId, hiddenAt: null, id: { not: id } },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: { id: true, name: true, iconUrl: true, genre: true, universeId: true },
    }),
  ]);
  const t = parseTrailer(game.trailerUrl);
  const [thumbs, avatars] = await Promise.all([
    gameThumbnails([t ? null : game.universeId, ...devGames.map((g) => g.universeId)]),
    robloxAvatars([game.owner.robloxVerified ? game.owner.robloxUserId : null]),
  ]);
  const thumb = t ? null : thumbs.get(game.universeId ?? "") ?? null;
  const devAvatar = game.owner.robloxVerified && game.owner.robloxUserId ? avatars.get(game.owner.robloxUserId) : undefined;
  const isOwner = user?.id === game.ownerId;
  const upcoming = isUpcoming(game.releaseAt);
  const earns = earning.has(game.id) && !isOwner;
  const devName = publicName(game.owner);
  const ratingCount = byStars.reduce((n, r) => n + r._count._all, 0);
  const starCount = (n: number) => byStars.find((r) => r.rating === n)?._count._all ?? 0;

  return (
    <div className="space-y-10">
      {game.hiddenAt && (
        <p className="text-sm text-mute">
          Only you can see this page. The game is hidden.{" "}
          <Link href={`/dashboard/games/${game.id}#visibility`} className="text-lime underline-offset-4 hover:underline">Show it again</Link>
        </p>
      )}
      {/* Same view-transition name as the homepage card, so the card grows into this player. */}
      <div className="relative aspect-video overflow-hidden rounded-media bg-panel shadow-lift lg:aspect-[21/8]" style={{ viewTransitionName: `game-${game.id}` }}>
        {t?.kind === "youtube" ? (
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${t.id}?rel=0&modestbranding=1&playsinline=1`}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            title={`${game.name} trailer`}
          />
        ) : t?.kind === "video" ? (
          <video className="absolute inset-0 h-full w-full object-cover" src={t.src} controls muted playsInline preload="metadata" />
        ) : thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt={`${game.name} screenshot`} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <GameIcon url={game.iconUrl} className="aspect-square h-1/3 rounded-ctl" />
          </div>
        )}
      </div>

      {/* Title, then the two things you came for: play it. */}
      <header className="space-y-5">
        <div className="flex min-w-0 gap-4">
          <GameIcon url={game.iconUrl} className="h-16 w-16 shrink-0 rounded-ctl" />
          <div className="min-w-0">
            <h1 className="page-title">{game.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-mute">
              <a href="#dev" className="transition hover:text-cream">by <span className="font-semibold text-cream">{devName}</span></a>
              <span aria-hidden>·</span>
              <span>{game.genre}</span>
              {upcoming && (
                <>
                  <span aria-hidden>·</span>
                  <span className="tabular-nums text-cream">{releaseLabel(game.releaseAt!)}</span>
                </>
              )}
              {isVerifiedGame(game) && (
                <>
                  <span aria-hidden>·</span>
                  <span className="inline-flex items-center gap-1 text-cream"><BadgeCheck className="h-3.5 w-3.5" /> Verified</span>
                </>
              )}
              {game.seriesTestedAt && (
                <>
                  <span aria-hidden>·</span>
                  {game.seriesVideoUrl ? (
                    <a href={game.seriesVideoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-lime underline-offset-4 hover:underline">
                      <Clapperboard className="h-3.5 w-3.5" /> Tested in our series · Watch episode
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-lime"><Clapperboard className="h-3.5 w-3.5" /> Tested in our series</span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {upcoming ? (
            <span className="btn-quiet pointer-events-none h-12 px-6 text-[15px]">{releaseLabel(game.releaseAt!)}</span>
          ) : earns ? (
            <form action={playGame}>
              <input type="hidden" name="gameId" value={game.id} />
              <button className="btn h-12 px-6 text-[15px]"><Ticket className="h-4 w-4" /> Play · earn 1 credit</button>
            </form>
          ) : (
            <a href={`/go/${game.id}`} target="_blank" rel="noopener" className="btn h-12 px-6 text-[15px]"><Play className="h-4 w-4 fill-current" /> Play on Roblox</a>
          )}
          {isOwner && <Link href={`/dashboard/games/${game.id}`} className="link ml-1">Manage game</Link>}
        </div>
      </header>

      {/* Numbers in one line, no boxes. */}
      <dl className="grid grid-cols-2 gap-x-6 gap-y-5 border-y border-line py-5 sm:grid-cols-4">
        <Stat label="Rating" value={stats._avg.rating ? stats._avg.rating.toFixed(1) : "–"} icon={stats._avg.rating ? <Star className="h-4 w-4 fill-lime text-lime" /> : null} />
        <Stat label="Ratings" value={ratingCount.toLocaleString()} />
        <Stat label="Playing now" value={game.playing.toLocaleString()} icon={<Users className="h-4 w-4 text-mute" />} />
        <Stat label="Roblox visits" value={game.visits.toLocaleString()} />
      </dl>

      <section className="grid gap-12 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-12">
          {game.description && !/^\s*\[.*\]\s*$/.test(game.description) && (
            <div>
              <h2 className="h-section">About</h2>
              <p className="mt-3 max-w-prose whitespace-pre-line text-sm leading-relaxed text-mute">{game.description.slice(0, 600)}</p>
            </div>
          )}

          {/* Reviews: players who played 10+ minutes, with stars. */}
          <div id="reviews" className="space-y-4">
            <h2 className="h-section">Feedback <span className="text-mute tabular-nums">{ratingCount}</span></h2>
            {ratingCount > 0 && (
              <div className="flex flex-wrap items-center gap-8">
                <div>
                  <div className="flex items-center gap-1.5 font-display text-[40px] font-semibold leading-none tabular-nums">
                    {stats._avg.rating!.toFixed(1)} <Star className="h-7 w-7 fill-lime text-lime" />
                  </div>
                  <p className="mt-1 text-xs text-mute">{ratingCount} rating{ratingCount === 1 ? "" : "s"}</p>
                </div>
                <ul className="min-w-[180px] flex-1 space-y-1">
                  {[5, 4, 3, 2, 1].map((n) => (
                    <li key={n} className="flex items-center gap-2 text-xs text-mute">
                      <span className="w-3 tabular-nums">{n}</span>
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[.06]">
                        <span className="block h-full rounded-full bg-lime" style={{ width: `${(starCount(n) / ratingCount) * 100}%` }} />
                      </span>
                      <span className="w-6 text-right tabular-nums">{starCount(n)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {reviews.length === 0 ? (
              <p className="text-sm text-mute">
                No feedback yet. Only players who played 10+ minutes can leave feedback, so every review here is real.{" "}
                {earns && <span className="text-cream">Play it now and earn 1 credit for yours.</span>}
              </p>
            ) : (
              <ul className="divide-y divide-line border-y border-line">
                {reviews.map((r) => (
                  <li key={r.id} className="space-y-1 py-3">
                    <div className="flex items-center gap-2 text-xs text-mute">
                      <span className="font-semibold text-cream">{publicName(r.player)}</span>
                      {r.rating && <Stars n={r.rating} />}
                      {r.completedAt && <span>{ago(r.completedAt)}</span>}
                    </div>
                    {r.feedback && <p className="whitespace-pre-line text-sm">{r.feedback}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>

        </div>

        {/* The developer: who made it and what else they made. */}
        <aside id="dev" className="space-y-5 lg:border-l lg:border-line lg:pl-8">
          <h2 className="eyebrow">Developer</h2>
          <div className="flex items-center gap-3">
            {devAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={devAvatar} alt="" className="h-12 w-12 rounded-full bg-white/[.06]" />
            ) : (
              <span aria-hidden className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[.06] font-display text-lg font-semibold">{devName.slice(0, 1).toUpperCase()}</span>
            )}
            <div className="min-w-0">
              <div className="truncate font-semibold">{devName}</div>
              <div className="text-xs text-mute">
                {devGames.length + 1} game{devGames.length ? "s" : ""} · on Spawnswap since {game.owner.createdAt.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
              </div>
            </div>
          </div>
          {game.owner.robloxVerified && game.owner.robloxUserId && (
            <a href={`https://www.roblox.com/users/${game.owner.robloxUserId}/profile`} target="_blank" rel="noopener noreferrer" className="link">Roblox profile ↗</a>
          )}
          {devGames.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="text-xs text-mute">More from {devName}</div>
              <ul className="space-y-3">
                {devGames.map((g) => (
                  <li key={g.id}>
                    <Link href={`/games/${g.id}`} className="group flex items-center gap-3">
                      <span className="relative block aspect-video w-24 shrink-0 overflow-hidden rounded-[8px] bg-panel">
                        {thumbs.get(g.universeId ?? "") ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={thumbs.get(g.universeId ?? "")} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <GameIcon url={g.iconUrl} className="absolute inset-0 h-full w-full" />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold transition group-hover:text-lime">{displayName(g.name)}</span>
                        <span className="block text-xs text-faint">{g.genre}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-mute">{label}</dt>
      <dd className="mt-1 flex items-center gap-1.5 font-display text-2xl font-semibold tabular-nums">{value} {icon}</dd>
    </div>
  );
}

function Stars({ n }: { n: number }) {
  return (
    <span className="inline-flex" aria-label={`${n} of 5 stars`}>
      {[1, 2, 3, 4, 5].map((k) => (
        <Star key={k} className={`h-3 w-3 ${k <= n ? "fill-lime text-lime" : "text-line"}`} aria-hidden />
      ))}
    </span>
  );
}
