import type { Metadata } from "next";
import Link from "next/link";
import { CREDIT_PACKS, EARLY_BIRD_ACCOUNTS, EARLY_BIRD_CREDITS, FEATURED_OPTIONS, MAX_OPEN_TASKS, REFERRAL_CREDITS, REQUIRED_SECONDS, TASK_TTL_HOURS, fmt } from "@/lib/money";

export const metadata: Metadata = {
  title: "How it works",
  description: "How Spawnswap works: play other developers' Roblox games to earn credits, spend credits to get real players for your own game.",
};

const minutes = Math.round(REQUIRED_SECONDS / 60);

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-4">
      <span className="font-display w-6 shrink-0 text-xl font-bold leading-6 text-lime tabular-nums">{n}</span>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <div className="mt-1 text-sm leading-relaxed text-mute">{children}</div>
      </div>
    </li>
  );
}

function Qa({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div className="py-4">
      <h3 className="font-semibold">{q}</h3>
      <div className="mt-1 text-sm leading-relaxed text-mute">{children}</div>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <article className="mx-auto max-w-3xl space-y-14">
      <header>
        <p className="eyebrow">How it works</p>
        <h1 className="mt-2 text-[32px] font-bold leading-[1.08] sm:text-[42px]">Play games, get players.</h1>
        <p className="mt-3 max-w-2xl text-mute">
          Spawnswap is a swap between Roblox developers. You play someone else&apos;s game, they (or someone else) play yours.
          Credits keep it fair.
        </p>
      </header>

      <section className="border-l-2 border-lime pl-5 sm:pl-6">
        <h2 className="text-2xl font-bold">The one rule: 1 credit = 1 real player</h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          <div>
            <div className="text-sm font-semibold text-lime">You earn 1 credit</div>
            <p className="mt-1 text-sm leading-relaxed text-cream/90">
              every time you play another developer&apos;s game for {minutes} minutes.
            </p>
          </div>
          <div>
            <div className="text-sm font-semibold text-lime">You spend 1 credit</div>
            <p className="mt-1 text-sm leading-relaxed text-cream/90">
              every time a real player does the same for your game: plays it for {minutes} minutes.
            </p>
          </div>
        </div>
        <p className="mt-5 text-sm text-mute">
          So yes: to get one player, you spend one credit, and that player earns one for playing. Nobody pays to play.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold">An example</h2>
        <ol className="mt-5 space-y-5">
          <Step n={1} title="Alex signs up and links a Roblox account">
            Alex adds a short code to their Roblox profile so we know the account is really theirs.
            {EARLY_BIRD_CREDITS > 0 && <> The first {EARLY_BIRD_ACCOUNTS} developers also start with {EARLY_BIRD_CREDITS} free credits.</>}
          </Step>
          <Step n={2} title="Alex adds a game">
            Alex pastes the Roblox link. The game shows on the site right away.
          </Step>
          <Step n={3} title="Alex plays 3 games and asks for 3 players">
            {minutes} minutes each gives Alex 3 credits.
            Alex spends them on 3 players. The game now shows up on the Play &amp; earn page for other developers.
          </Step>
          <Step n={4} title="Three people play Alex's game">
            Each one plays {minutes} minutes and earns 1 credit. Alex gets 3 real players, and most of them leave a star rating.
          </Step>
          <Step n={5} title="Alex wants more players">
            Play more games to earn more credits for free, or buy a pack to skip the playing.
          </Step>
        </ol>
      </section>

      <section className="grid gap-10 sm:grid-cols-2">
        <div>
          <h2 className="text-xl font-bold">If you just want to play</h2>
          <p className="mt-2 text-sm leading-relaxed text-mute">
            Browse trailers on the homepage, play what looks good, like games and read real player feedback on game pages. It&apos;s all free.
            Playing through Play &amp; earn also gives you credits, in case you make a game later.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-bold">If you made a game</h2>
          <p className="mt-2 text-sm leading-relaxed text-mute">
            Every player you get played for real, and after playing they can rate it, so you learn what works and what to fix.
            Add a 10 to 30 second trailer: games with a trailer are shown first.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold">Buying credits</h2>
        <p className="mt-2 text-sm text-mute">Optional. Earning by playing is always free.</p>
        <ul className="mt-4 divide-y divide-line border-y border-line text-sm">
          {CREDIT_PACKS.map((p) => (
            <li key={p.id} className="flex items-center justify-between py-2.5">
              <span>{p.credits} credits <span className="text-mute">= {p.credits} players</span></span>
              <span className="font-semibold tabular-nums">{fmt(p.cents)}</span>
            </li>
          ))}
        </ul>
        <h3 className="mt-8 font-semibold">Spotlight on the homepage</h3>
        <p className="mt-1 text-sm text-mute">
          Put your trailer at the top of the homepage: {FEATURED_OPTIONS.map((o) => `${fmt(o.cents)} for ${o.days} day${o.days > 1 ? "s" : ""}`).join(", ")}.
          Needs a trailer.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold">Questions</h2>
        <div className="mt-2 divide-y divide-line border-y border-line">
          <Qa q="How do you know someone really played?">
            We check with Roblox about once a minute that the player is in a game. Developers can also add a small script to their game
            that tells us exactly who is inside. Those games get a Verified badge and are shown first to players.
          </Qa>
          <Qa q="What if I stop before I get all my players?">
            Stop your campaign and the credits nobody used come back to you.
          </Qa>
          <Qa q="How many games can I play at once?">
            Up to {MAX_OPEN_TASKS}. Each one has to reach {minutes} minutes within {TASK_TTL_HOURS} hours, or it expires and the slot goes back to that game.
          </Qa>
          <Qa q="Why do I have to play before I can post?">
            So every developer here also plays. That&apos;s what keeps players coming for everyone.
          </Qa>
          <Qa q="Is there an invite bonus?">
            Yes. Share your invite link: your friend starts with {REFERRAL_CREDITS} credits, and you get {REFERRAL_CREDITS} once they finish their first game.
          </Qa>
          <Qa q="Can I pay with Robux?">
            No. Credits are earned by playing or bought with a card.
          </Qa>
          <Qa q="Is this made by Roblox?">
            No. Spawnswap is independent and not affiliated with Roblox Corporation.
          </Qa>
        </div>
      </section>

      <section className="flex flex-wrap items-center gap-3">
        <Link href="/signup" className="btn">Get players</Link>
        <Link href="/play" className="btn-quiet">Play &amp; earn</Link>
      </section>
    </article>
  );
}
