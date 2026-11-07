import type { Metadata } from "next";
import Link from "next/link";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import { Gamepad2, Trophy, Clapperboard, Info } from "lucide-react";
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
            <Link href="/" className="mr-1 flex items-center gap-2 font-display text-base font-extrabold tracking-tight sm:mr-2 sm:text-lg">
              <span className="h-2.5 w-2.5 rounded-full bg-marquee shadow-[0_0_12px_2px_rgba(255,178,56,.55)]" aria-hidden />
              Spawnswap
            </Link>
            <Link href="/" className="hidden min-h-[44px] items-center gap-2 rounded-ctl px-3 text-sm text-mute hover:text-cream sm:flex">
              <Clapperboard className="h-4 w-4" /> Discover
            </Link>
            <Link href="/play" className="flex min-h-[44px] items-center gap-2 whitespace-nowrap rounded-ctl px-2 text-sm sm:px-3 text-mute hover:text-cream">
              <Gamepad2 className="hidden h-4 w-4 sm:block" /> <span className="sm:hidden">Play</span><span className="hidden sm:inline">Play &amp; earn</span>
            </Link>
            <Link href="/leaderboard" className="flex min-h-[44px] items-center gap-2 rounded-ctl px-2 text-sm sm:px-3 text-mute hover:text-cream">
              <Trophy className="h-4 w-4" /> <span className="hidden sm:inline">Top</span><span className="sr-only sm:hidden">Leaderboards</span>
            </Link>
            <Link href="/how-it-works" className="hidden min-h-[44px] items-center gap-2 rounded-ctl px-3 text-sm text-mute hover:text-cream sm:flex">
              <Info className="h-4 w-4" /> <span className="hidden md:inline">How it works</span><span className="sr-only md:hidden">How it works</span>
            </Link>
            <div className="ml-auto flex items-center gap-1 text-sm sm:gap-2">
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
                  <Link href="/login" className="min-h-[44px] whitespace-nowrap rounded-ctl px-2 leading-[44px] sm:px-3 text-mute hover:text-cream">Log in</Link>
                  <Link href="/signup" className="btn whitespace-nowrap px-3 sm:px-4">Get players</Link>
                </>
              )}
            </div>
          </nav>
          {/* Phones: a second row, so the top row never gets wider than the screen. */}
          <div className="mx-auto flex max-w-6xl gap-1 px-4 pb-2 text-sm sm:hidden">
            <Link href="/how-it-works" className="flex items-center gap-1.5 rounded-ctl px-3 py-1.5 text-mute hover:text-cream">
              <Info className="h-4 w-4" /> How it works
            </Link>
            {user && (
              <>
                <Link href="/dashboard" className="rounded-ctl px-3 py-1.5 text-mute hover:text-cream">My games</Link>
                <form action="/api/logout" method="post" className="ml-auto">
                  <button className="rounded-ctl px-3 py-1.5 text-mute hover:text-cream">Log out</button>
                </form>
              </>
            )}
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8 sm:py-10">{children}</main>
        <footer className="mx-auto flex max-w-6xl flex-wrap gap-x-5 gap-y-2 px-4 pb-10 pt-6 text-xs text-mute/70">
          <span>Not affiliated with Roblox Corporation.</span>
          <Link href="/how-it-works" className="hover:text-cream">How it works</Link>
          <Link href="/terms" className="hover:text-cream">Terms</Link>
          <Link href="/privacy" className="hover:text-cream">Privacy</Link>
          <Link href="/privacy#cookies" className="hover:text-cream">Cookies</Link>
          <Link href="/refund" className="hover:text-cream">Refunds</Link>
          <Link href="/contact" className="hover:text-cream">Contact</Link>
          <span>For ages 13+.</span>
        </footer>
      </body>
    </html>
  );
}
