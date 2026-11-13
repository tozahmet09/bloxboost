import Link from "next/link";
import { Heart } from "lucide-react";
import { topDevs, topGames, topTesters, publicName } from "@/lib/community";
import { robloxAvatars } from "@/lib/avatars";
import { GameIcon } from "@/components/GameIcon";
import { CountUp } from "@/components/CountUp";
import { SfxOnMount } from "@/components/Sfx";

export const dynamic = "force-dynamic";
export const metadata = { title: "Leaderboards" };

const TABS = [
  { id: "games", label: "Top games", sub: "Games with the most likes." },
  { id: "devs", label: "Top devs", sub: "Developers ranked by the minutes testers spent in their games." },
  { id: "testers", label: "Top testers", sub: "Testers ranked by minutes played in other devs' games." },
] as const;
type Tab = (typeof TABS)[number]["id"];

type Person = { id: string; name: string; robloxUserId: string | null; stat: string; minutes: number; extra: string };

export default async function Leaderboard({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab: raw } = await searchParams;
  // "players" was the old name of the testers tab; keep old links working.
  const tab: Tab = raw === "players" ? "testers" : TABS.some((t) => t.id === raw) ? (raw as Tab) : "testers";
  const info = TABS.find((t) => t.id === tab)!;

  let people: Person[] = [];
  if (tab === "devs") {
    people = (await topDevs(25)).map((d) => ({
      id: d.user.id, name: publicName(d.user), robloxUserId: d.user.robloxVerified ? d.user.robloxUserId : null,
      stat: "min played", minutes: d.minutes, extra: `${d.games} game${d.games === 1 ? "" : "s"}`,
    }));
  } else if (tab === "testers") {
    people = (await topTesters(25)).map((p) => ({
      id: p.user.id, name: publicName(p.user), robloxUserId: p.user.robloxVerified ? p.user.robloxUserId : null,
      stat: "min", minutes: p.minutes, extra: `${p.plays} game${p.plays === 1 ? "" : "s"}`,
    }));
  }
  const games = tab === "games" ? await topGames(25) : [];

  const ids = people.map((p) => p.robloxUserId);
  const [heads, bodies] = await Promise.all([robloxAvatars(ids.slice(3)), robloxAvatars(ids.slice(0, 3), "avatar")]);
  const podium = people.slice(0, 3);
  const rest = people.slice(3);
  const empty = (
    <p className="py-16 text-center text-mute">
      Nobody here yet. <Link href="/#earn-title" className="font-semibold text-lime hover:underline">Play a game</Link> and take the #1 spot.
    </p>
  );

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <p className="eyebrow">Community</p>
        <h1 className="mt-1 page-title">Leaderboards</h1>
        <p className="mt-2 text-mute">{info.sub}</p>
      </div>

      <div className="flex gap-2 border-b border-line text-[15px]" role="tablist">
        {TABS.map((t) => (
          <Link key={t.id} href={`/leaderboard?tab=${t.id}`} role="tab" aria-selected={tab === t.id}
            className={`relative -mb-px px-3 py-3 font-semibold transition ${tab === t.id ? "text-lime" : "text-cream/80 hover:text-cream"}`}>
            {t.label}
            {tab === t.id && <span aria-hidden className="absolute inset-x-0 bottom-0 h-[3px] rounded-full bg-lime shadow-[0_0_12px_rgba(200,240,49,.8)]" />}
          </Link>
        ))}
      </div>

      {tab === "games" && (games.length === 0 ? empty : (
        <ol className="divide-y divide-line">
          {games.map((g, i) => (
            <li key={g.id} className="animate-rise-in" style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}>
              <Link href={`/games/${g.id}`} className="group flex items-center gap-4 py-3">
                <Rank n={i + 1} />
                <GameIcon url={g.iconUrl} className="h-12 w-12 shrink-0 rounded-ctl" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold group-hover:text-lime">{g.name}</div>
                  <div className="text-xs text-mute">{g.genre}</div>
                </div>
                <span className="inline-flex items-center gap-1 text-sm font-semibold tabular-nums"><Heart className="h-4 w-4 text-lime" /> <CountUp value={g.likeCount} /></span>
              </Link>
            </li>
          ))}
        </ol>
      ))}

      {tab !== "games" && (people.length === 0 ? empty : (
        <>
          <SfxOnMount name="whoosh" delay={150} />
          {/* Podium: #2 left, #1 middle (bigger, glowing), #3 right. */}
          <div className="grid grid-cols-3 items-end gap-2 border-b border-line pb-6 sm:gap-6">
            {[podium[1], podium[0], podium[2]].map((p, col) => {
              if (!p) return <div key={col} />;
              const rank = col === 1 ? 1 : col === 0 ? 2 : 3;
              const img = p.robloxUserId ? bodies.get(p.robloxUserId) : undefined;
              return (
                <div key={p.id} className="flex animate-podium-in flex-col items-center text-center" style={{ animationDelay: `${[150, 0, 300][col]}ms` }}>
                  <div className={`relative ${rank === 1 ? "h-44 w-44 sm:h-64 sm:w-64" : "h-32 w-32 sm:h-48 sm:w-48"}`}>
                    {rank === 1 && <span aria-hidden className="absolute inset-[8%] animate-halo rounded-full bg-lime/30 blur-3xl" />}
                    <div className="relative h-full w-full animate-float" style={{ animationDelay: `${col * -1.4}s` }}>
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img} alt={`${p.name}'s Roblox avatar`} className="h-full w-full object-contain drop-shadow-[0_18px_24px_rgba(0,0,0,.55)]" />
                      ) : (
                        <Blocky />
                      )}
                    </div>
                  </div>
                  <div className={`mt-1 font-display font-black italic leading-none ${rank === 1 ? "text-5xl text-lime drop-shadow-[0_0_18px_rgba(200,240,49,.6)] sm:text-6xl" : "text-3xl text-cream sm:text-4xl"}`}>#{rank}</div>
                  <div className={`mt-2 max-w-full truncate font-display font-bold ${rank === 1 ? "text-lg sm:text-2xl" : "text-base sm:text-xl"}`}>{p.name}</div>
                  <div className="mt-0.5 text-xs text-mute sm:text-sm"><CountUp value={p.minutes} /> {p.stat} · {p.extra}</div>
                </div>
              );
            })}
          </div>

          {rest.length > 0 && (
            <ol className="divide-y divide-line">
              {rest.map((p, i) => {
                const img = p.robloxUserId ? heads.get(p.robloxUserId) : undefined;
                return (
                  <li key={p.id} className="flex animate-rise-in items-center gap-4 py-3" style={{ animationDelay: `${400 + Math.min(i, 10) * 50}ms` }}>
                    <span className="w-10 shrink-0 font-display text-base font-bold tabular-nums text-cream/90">#{i + 4}</span>
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt="" className="h-9 w-9 shrink-0 rounded-full bg-panel" loading="lazy" />
                    ) : (
                      <span className="h-9 w-9 shrink-0 rounded-full bg-panel" />
                    )}
                    <span className="min-w-0 flex-1 truncate font-semibold">{p.name}</span>
                    <span className="w-24 text-right text-sm font-semibold"><CountUp value={p.minutes} /> min</span>
                    <span className="hidden w-20 text-right text-sm text-mute sm:block">{p.extra}</span>
                  </li>
                );
              })}
            </ol>
          )}
        </>
      ))}
    </div>
  );
}

function Rank({ n }: { n: number }) {
  return <span className={`w-9 shrink-0 font-display text-xl font-black italic tabular-nums ${n <= 3 ? "text-lime" : "text-mute"}`}>#{n}</span>;
}

/** Stand-in when someone's Roblox avatar can't be loaded: a simple blocky figure. */
function Blocky() {
  return (
    <svg viewBox="0 0 100 120" className="h-full w-full text-panel" aria-hidden>
      <rect x="32" y="6" width="36" height="32" rx="4" fill="currentColor" />
      <rect x="26" y="42" width="48" height="40" rx="4" fill="currentColor" />
      <rect x="10" y="42" width="14" height="38" rx="3" fill="currentColor" />
      <rect x="76" y="42" width="14" height="38" rx="3" fill="currentColor" />
      <rect x="28" y="84" width="20" height="32" rx="3" fill="currentColor" />
      <rect x="52" y="84" width="20" height="32" rx="3" fill="currentColor" />
    </svg>
  );
}
