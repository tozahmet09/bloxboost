import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { parseTrailer } from "@/lib/trailer";
import { aiCheckOn } from "@/lib/trailerCheck";
import { adminCheckOldTrailers, adminDecideTrailer } from "@/app/actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Trailer review", robots: { index: false } };

export default async function TrailerReview() {
  await requireAdmin();
  const [waiting, unchecked, rejected] = await Promise.all([
    db.game.findMany({
      where: { trailerStatus: "REVIEW", pendingTrailerUrl: { not: null } },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, pendingTrailerUrl: true, trailerNote: true, owner: { select: { displayName: true, email: true } } },
    }),
    db.game.count({ where: { trailerUrl: { not: null }, trailerCheckedAt: null } }),
    db.game.findMany({
      where: { trailerStatus: "REJECTED" },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, name: true, trailerNote: true },
    }),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <p className="eyebrow">Admin</p>
        <h1 className="mt-1 page-title">Trailer review</h1>
        <p className="mt-2 text-sm text-mute">
          {aiCheckOn()
            ? "The AI approves clear trailers by itself. The ones it wasn't sure about wait here."
            : "AI check is off: add ANTHROPIC_API_KEY in Vercel to turn it on. Only the technical checks run now."}
        </p>
      </div>

      {unchecked > 0 && (
        <form action={adminCheckOldTrailers} className="flex flex-wrap items-center gap-3 border-y border-line py-4">
          <p className="flex-1 text-sm">
            {unchecked} live trailer{unchecked === 1 ? " was" : "s were"} added before checks existed.
            {aiCheckOn() ? " Check them 4 at a time; anything unclear moves here and is hidden until you decide." : ""}
          </p>
          <button className="btn" disabled={!aiCheckOn()}>Check 4 now</button>
        </form>
      )}

      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold">Waiting ({waiting.length})</h2>
        {waiting.length === 0 && <p className="text-sm text-mute">Nothing to review.</p>}
        <ul className="divide-y divide-line border-y border-line">
          {waiting.map((g) => {
            const t = parseTrailer(g.pendingTrailerUrl);
            return (
              <li key={g.id} className="flex flex-wrap gap-6 py-6">
                <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-ctl bg-panel">
                  {t?.kind === "youtube" ? (
                    <iframe
                      className="absolute inset-0 h-full w-full"
                      src={`https://www.youtube-nocookie.com/embed/${t.id}?rel=0`}
                      title={`${g.name} trailer`}
                      allowFullScreen
                    />
                  ) : t ? (
                    <video className="h-full w-full" src={t.src} controls muted playsInline preload="metadata" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1 space-y-3 text-sm">
                  <p>
                    <Link href={`/games/${g.id}`} className="font-semibold hover:underline">{g.name}</Link>
                    <span className="text-mute"> by {g.owner.displayName} ({g.owner.email})</span>
                  </p>
                  {g.trailerNote && <p className="text-mute">AI: {g.trailerNote}</p>}
                  <form action={adminDecideTrailer} className="flex flex-wrap items-start gap-3">
                    <input type="hidden" name="gameId" value={g.id} />
                    <button name="decision" value="approve" className="btn">Approve</button>
                    <input
                      name="reason"
                      aria-label="Reason shown to the developer"
                      placeholder="Reason if rejecting (the developer sees this)"
                      className="input min-w-0 flex-1 basis-56"
                    />
                    <button name="decision" value="reject" className="btn-quiet">Reject</button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {rejected.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-xl font-bold">Recently rejected</h2>
          <ul className="divide-y divide-line border-y border-line text-sm">
            {rejected.map((g) => (
              <li key={g.id} className="flex flex-wrap gap-x-4 py-2.5">
                <Link href={`/games/${g.id}`} className="font-semibold hover:underline">{g.name}</Link>
                <span className="text-mute">{g.trailerNote}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
