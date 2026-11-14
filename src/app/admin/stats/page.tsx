import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Site numbers", robots: { index: false } };

const since = (days: number) => new Date(Date.now() - days * 864e5);

/** Signup → Roblox link → play → game: where new people stop. */
export default async function Stats() {
  await requireAdmin();
  const counts = async (from?: Date) => {
    const c = from ? { createdAt: { gte: from } } : {};
    const [signups, linked, started, played, devs, games] = await Promise.all([
      db.user.count({ where: c }),
      db.user.count({ where: { ...c, robloxVerified: true } }),
      db.user.count({ where: { ...c, tasks: { some: {} } } }),
      db.user.count({ where: { ...c, tasks: { some: { status: "COMPLETED" } } } }),
      db.user.count({ where: { ...c, games: { some: {} } } }),
      db.game.count({ where: c }),
    ]);
    return { signups, linked, started, played, devs, games };
  };
  const [week, all, recent, games] = await Promise.all([
    counts(since(7)),
    counts(),
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { id: true, displayName: true, createdAt: true, robloxVerified: true, _count: { select: { games: true, tasks: true } } },
    }),
    db.game.findMany({ orderBy: { createdAt: "desc" }, take: 30, select: { id: true, name: true, createdAt: true, hiddenAt: true, releaseAt: true } }),
  ]);
  const rows: [string, keyof typeof all][] = [
    ["Signed up", "signups"],
    ["Linked Roblox", "linked"],
    ["Started a play", "started"],
    ["Finished a play", "played"],
    ["Added a game", "devs"],
    ["Games added", "games"],
  ];
  const day = (d: Date) => d.toISOString().slice(0, 16).replace("T", " ");

  return (
    <div className="space-y-10">
      <div>
        <p className="eyebrow">Admin</p>
        <h1 className="mt-1 page-title">Site numbers</h1>
        <p className="mt-2 text-sm text-mute">Where new people stop, from signing up to adding a game. Times in UTC.</p>
      </div>
      <table className="w-full max-w-md text-sm tabular-nums">
        <thead className="text-left text-mute">
          <tr><th className="py-2 font-normal">Step</th><th className="py-2 text-right font-normal">Last 7 days</th><th className="py-2 text-right font-normal">All time</th></tr>
        </thead>
        <tbody className="divide-y divide-line border-y border-line">
          {rows.map(([label, k]) => (
            <tr key={k}><td className="py-2">{label}</td><td className="py-2 text-right">{week[k]}</td><td className="py-2 text-right">{all[k]}</td></tr>
          ))}
        </tbody>
      </table>
      <section>
        <h2 className="text-lg font-semibold">Newest accounts</h2>
        <ul className="mt-3 divide-y divide-line border-y border-line text-sm">
          {recent.map((u) => (
            <li key={u.id} className="flex flex-wrap gap-x-4 py-2">
              <span className="w-36 text-mute tabular-nums">{day(u.createdAt)}</span>
              <span className="min-w-0 flex-1 truncate">{u.displayName}</span>
              <span className="text-mute">{u.robloxVerified ? "Roblox linked" : "no Roblox"} · {u._count.tasks} plays · {u._count.games} games</span>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="text-lg font-semibold">Newest games</h2>
        <ul className="mt-3 divide-y divide-line border-y border-line text-sm">
          {games.map((g) => (
            <li key={g.id} className="flex flex-wrap gap-x-4 py-2">
              <span className="w-36 text-mute tabular-nums">{day(g.createdAt)}</span>
              <span className="min-w-0 flex-1 truncate">{g.name}</span>
              <span className="text-mute">{g.hiddenAt ? "archived" : g.releaseAt && g.releaseAt > new Date() ? "coming soon" : "live"}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
