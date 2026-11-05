import type { Metadata } from "next";
import Link from "next/link";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import { Gamepad2, Trophy, Clapperboard } from "lucide-react";
import "./globals.css";
import { getUser } from "@/lib/auth";
import { CreditCounter } from "@/components/CreditCounter";

const display = Bricolage_Grotesque({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-display" });
const body = Figtree({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "Spawnswap: new Roblox games, before they blow up",
  description: "Watch trailers of brand-new Roblox games. Developers: get your first 100 real players, verified in-game.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <header className="sticky top-0 z-30 border-b border-line bg-ink/90 backdrop-blur">
          <nav className="mx-auto flex max-w-6xl items-center gap-1 px-4 py-2 sm:gap-2">
            <Link href="/" className="mr-2 flex items-center gap-2 font-display text-lg font-extrabold tracking-tight">
              <span className="h-2.5 w-2.5 rounded-full bg-marquee shadow-[0_0_12px_2px_rgba(255,178,56,.55)]" aria-hidden />
              Spawnswap
            </Link>
            <Link href="/" className="hidden min-h-[44px] items-center gap-2 rounded-ctl px-3 text-sm text-mute hover:text-cream sm:flex">
              <Clapperboard className="h-4 w-4" /> Discover
            </Link>
            <Link href="/play" className="flex min-h-[44px] items-center gap-2 rounded-ctl px-3 text-sm text-mute hover:text-cream">
              <Gamepad2 className="h-4 w-4" /> Play &amp; earn
            </Link>
            <Link href="/leaderboard" className="flex min-h-[44px] items-center gap-2 rounded-ctl px-3 text-sm text-mute hover:text-cream">
              <Trophy className="h-4 w-4" /> <span className="hidden sm:inline">Top</span><span className="sr-only sm:hidden">Leaderboards</span>
            </Link>
            <div className="ml-auto flex items-center gap-2 text-sm">
              {user ? (
                <>
                  <Link href="/dashboard" className="hidden min-h-[44px] items-center rounded-ctl px-3 text-mute hover:text-cream sm:flex">My games</Link>
                  <CreditCounter value={user.credits} />
                  <form action="/api/logout" method="post" className="hidden sm:block">
                    <button className="min-h-[44px] rounded-ctl px-3 text-mute hover:text-cream">Log out</button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/login" className="min-h-[44px] rounded-ctl px-3 leading-[44px] text-mute hover:text-cream">Log in</Link>
                  <Link href="/signup" className="btn">Get players</Link>
                </>
              )}
            </div>
          </nav>
          {user && (
            <div className="mx-auto flex max-w-6xl gap-1 px-4 pb-2 text-sm sm:hidden">
              <Link href="/dashboard" className="rounded-ctl px-3 py-1.5 text-mute hover:text-cream">My games</Link>
              <form action="/api/logout" method="post" className="ml-auto">
                <button className="rounded-ctl px-3 py-1.5 text-mute hover:text-cream">Log out</button>
              </form>
            </div>
          )}
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8 sm:py-10">{children}</main>
        <footer className="mx-auto flex max-w-6xl flex-wrap gap-x-5 gap-y-2 px-4 pb-10 pt-6 text-xs text-mute/70">
          <span>Not affiliated with Roblox Corporation.</span>
          <Link href="/terms" className="hover:text-cream">Terms</Link>
          <Link href="/privacy" className="hover:text-cream">Privacy</Link>
        </footer>
      </body>
    </html>
  );
}
