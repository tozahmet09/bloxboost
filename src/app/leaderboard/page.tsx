import Link from "next/link";
import { Heart, Gamepad2 } from "lucide-react";
import { topDevs, topGames, topPlayers, publicName } from "@/lib/community";
import { GameIcon } from "@/components/GameIcon";

export const dynamic = "force-dynamic";
export const metadata = { title: "Leaderboards · BloxBoost" };

const TABS = [
  { id: "games", label: "Top games" },
  { id: "devs", label: "Top devs" },
  { id: "players", label: "Top players" },
] as const;

function Rank({ n }: { n: number }) {
  return <span className={`w-8 shrink-0 font-display text-xl font-extrabold tabular-nums ${n <= 3 ? "text-marquee" : "text-mute"}`}>{n}</span>;
}

export default async function Leaderboard({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab: raw } = await searchParams;
  const tab = TABS.some((t) => t.id === raw) ? raw! : "games";
  const [games, devs, players] = await Promise.all([
    tab === "games" ? topGames(25) : [],
    tab === "devs" ? topDevs(25) : [],
    tab === "players" ? topPlayers(25) : [],
  ]);
  const empty = <p className="py-10 text-center text-mute">Nobody here yet. Likes start counting the moment people play.</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="eyebrow">Community</p>
        <h1 className="mt-1 text-3xl font-extrabold">Leaderboards</h1>
        <p className="mt-2 text-sm text-mute">
          {tab === "games" && "Games with the most likes."}
          {tab === "devs" && "Developers ranked by the likes all their games got."}
          {tab === "players" && "Players ranked by likes on their comments, then by games they played and reviewed."}
        </p>
      </div>
      <div className="flex gap-1 border-b border-line text-sm" role="tablist">
        {TABS.map((t) => (
          <Link key={t.id} href={`/leaderboard?tab=${t.id}`} role="tab" aria-selected={tab === t.id}
            className={`-mb-px border-b-2 px-3 py-2.5 ${tab === t.id ? "border-marquee text-cream" : "border-transparent text-mute hover:text-cream"}`}>
            {t.label}
          </Link>
        ))}
      </div>

      {tab === "games" && (games.length === 0 ? empty : (
        <ol className="divide-y divide-line">
          {games.map((g, i) => (
            <li key={g.id}>
              <Link href={`/games/${g.id}`} className="group flex items-center gap-3 py-3">
                <Rank n={i + 1} />
                <GameIcon url={g.iconUrl} className="h-12 w-12 shrink-0 rounded-ctl" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold group-hover:text-marquee">{g.name}</div>
                  <div className="text-xs text-mute">{g.genre}</div>
                </div>
                <span className="inline-flex items-center gap-1 text-sm tabular-nums"><Heart className="h-4 w-4 text-marquee" /> {g.likeCount.toLocaleString()}</span>
              </Link>
            </li>
          ))}
        </ol>
      ))}

      {tab === "devs" && (devs.length === 0 ? empty : (
        <ol className="divide-y divide-line">
          {devs.map((d, i) => (
            <li key={d.user.id} className="flex items-center gap-3 py-3">
              <Rank n={i + 1} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{publicName(d.user)}</div>
                <div className="text-xs text-mute">{d.games} game{d.games === 1 ? "" : "s"}</div>
              </div>
              <span className="inline-flex items-center gap-1 text-sm tabular-nums"><Heart className="h-4 w-4 text-marquee" /> {d.likes.toLocaleString()}</span>
            </li>
          ))}
        </ol>
      ))}

      {tab === "players" && (players.length === 0 ? empty : (
        <ol className="divide-y divide-line">
          {players.map((p, i) => (
            <li key={p.user.id} className="flex items-center gap-3 py-3">
              <Rank n={i + 1} />
              <div className="min-w-0 flex-1 truncate font-semibold">{publicName(p.user)}</div>
              <span className="inline-flex items-center gap-1 text-sm tabular-nums" title="Likes on comments"><Heart className="h-4 w-4 text-marquee" /> {p.likes}</span>
              <span className="inline-flex w-14 items-center justify-end gap-1 text-sm text-mute tabular-nums" title="Games played and reviewed"><Gamepad2 className="h-4 w-4" /> {p.plays}</span>
            </li>
          ))}
        </ol>
      ))}
    </div>
  );
}
