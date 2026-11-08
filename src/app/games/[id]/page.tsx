import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BadgeCheck, Play, Star, Trash2, Users } from "lucide-react";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { parseTrailer } from "@/lib/trailer";
import { isVerifiedGame } from "@/lib/credits";
import { publicName } from "@/lib/community";
import { deleteComment, toggleCommentLike, toggleLike } from "@/app/actions";
import { GameIcon } from "@/components/GameIcon";
import { displayName, gameThumbnails } from "@/lib/thumbs";
import { LikeButton } from "@/components/LikeButton";
import { CommentForm } from "@/components/CommentForm";

export const dynamic = "force-dynamic";

const nameSel = { displayName: true, robloxUsername: true, robloxVerified: true } as const;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const g = await db.game.findUnique({ where: { id }, select: { name: true, description: true } });
  return g ? { title: displayName(g.name), description: g.description.slice(0, 160) } : {};
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
      scriptLastSeen: true, likeCount: true, ownerId: true,
      owner: { select: nameSel },
      comments: { orderBy: [{ likeCount: "desc" }, { createdAt: "desc" }], take: 100, include: { user: { select: { id: true, ...nameSel } } } },
    },
  });
  if (!game) notFound();
  game.name = displayName(game.name);
  const [stats, liked, myCommentLikes] = await Promise.all([
    db.playTask.aggregate({ where: { gameId: id, status: "COMPLETED" }, _count: { id: true }, _avg: { rating: true } }),
    user ? db.like.findUnique({ where: { userId_gameId: { userId: user.id, gameId: id } } }) : null,
    user ? db.commentLike.findMany({ where: { userId: user.id, comment: { gameId: id } }, select: { commentId: true } }) : [],
  ]);
  const likedComments = new Set(myCommentLikes.map((c) => c.commentId));
  const t = parseTrailer(game.trailerUrl);
  const thumb = t ? null : (await gameThumbnails([game.universeId])).get(game.universeId ?? "") ?? null;
  const isOwner = user?.id === game.ownerId;

  return (
    <div className="space-y-10">
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

      <header className="flex flex-wrap items-start justify-between gap-6">
        <div className="flex min-w-0 gap-4">
          <GameIcon url={game.iconUrl} className="h-16 w-16 shrink-0 rounded-ctl" />
          <div className="min-w-0">
            <h1 className="page-title">{game.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-mute">
              <span>by {publicName(game.owner)}</span>
              <span aria-hidden>·</span>
              <span>{game.genre}</span>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1 tabular-nums"><Users className="h-3.5 w-3.5" /> {game.playing.toLocaleString()} playing</span>
              {isVerifiedGame(game) && (
                <>
                  <span aria-hidden>·</span>
                  <span className="inline-flex items-center gap-1 text-cream"><BadgeCheck className="h-3.5 w-3.5" /> Verified</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LikeButton liked={!!liked} count={game.likeCount} action={toggleLike} field="gameId" value={game.id} />
          <a href={`/go/${game.id}`} target="_blank" rel="noopener" className="btn"><Play className="h-4 w-4 fill-current" /> Play on Roblox</a>
        </div>
      </header>

      <section className="grid gap-10 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-8">
          {game.description && <p className="max-w-prose whitespace-pre-line text-sm leading-relaxed text-mute">{game.description.slice(0, 600)}</p>}

          <div className="space-y-4">
            <h2 className="text-xl font-bold">Comments <span className="text-mute tabular-nums">{game.comments.length}</span></h2>
            {user ? (
              <CommentForm gameId={game.id} />
            ) : (
              <p className="text-sm text-mute"><Link href="/signup" className="text-coral underline">Make a free account</Link> to like and comment.</p>
            )}
            {game.comments.length === 0 ? (
              <p className="text-sm text-mute">No comments yet. Played it? Say what you liked.</p>
            ) : (
              <ul className="divide-y divide-line border-y border-line">
                {game.comments.map((c) => (
                  <li key={c.id} className="space-y-1 py-3">
                    <div className="flex items-center gap-2 text-xs text-mute">
                      <span className="font-semibold text-cream">{publicName(c.user)}</span>
                      {c.user.id === game.ownerId && <span className="chip bg-coral/10 text-coral">Dev</span>}
                      <span>{ago(c.createdAt)}</span>
                    </div>
                    <p className="whitespace-pre-line text-sm">{c.body}</p>
                    <div className="flex items-center gap-1">
                      <LikeButton size="sm" liked={likedComments.has(c.id)} count={c.likeCount} action={toggleCommentLike} field="id" value={c.id} label="Like comment" />
                      {(isOwner || user?.id === c.user.id) && (
                        <form action={deleteComment}>
                          <input type="hidden" name="id" value={c.id} />
                          <button aria-label="Delete comment" className="inline-flex min-h-[36px] items-center gap-1 rounded-ctl px-2 text-xs text-mute hover:text-danger">
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </button>
                        </form>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <aside className="space-y-4 lg:border-l lg:border-line lg:pl-8">
          <div>
            <div className="eyebrow">Verified players</div>
            <div className="mt-1 font-display text-3xl font-bold tabular-nums">{stats._count.id}</div>
            <p className="text-xs text-mute">Played 10+ minutes and left a review.</p>
          </div>
          {stats._avg.rating && (
            <div>
              <div className="eyebrow">Average rating</div>
              <div className="mt-1 flex items-center gap-1 font-display text-3xl font-bold tabular-nums">
                {stats._avg.rating.toFixed(1)} <Star className="h-5 w-5 fill-coral text-coral" />
              </div>
            </div>
          )}
          <div>
            <div className="eyebrow">Roblox visits</div>
            <div className="mt-1 font-display text-3xl font-bold tabular-nums">{game.visits.toLocaleString()}</div>
          </div>
          {isOwner && <Link href={`/dashboard/games/${game.id}`} className="btn-quiet">Manage game</Link>}
        </aside>
      </section>
    </div>
  );
}
