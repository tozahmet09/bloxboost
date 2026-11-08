import type { Metadata } from "next";
import Link from "next/link";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import { ChevronDown } from "lucide-react";
import { NavLinks } from "@/components/NavLinks";
import "./globals.css";
import { getUser } from "@/lib/auth";
import { CreditCounter } from "@/components/CreditCounter";

const display = Bricolage_Grotesque({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-display" });
const body = Figtree({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || "https://spawnswap.com"),
  title: { default: "Spawnswap: new Roblox games, before they blow up", template: "%s · Spawnswap" },
  description: "Watch trailers of brand-new Roblox games. Developers: get your first 100 real players, verified in-game.",
  twitter: { card: "summary_large_image" },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <header className="sticky top-0 z-30 border-b border-white/[.06] bg-ink/85 backdrop-blur-md">
          <nav className="mx-auto flex h-14 max-w-6xl items-center gap-1 px-4 sm:gap-2">
            <Link href="/" className="mr-1 flex items-center gap-2 font-display text-[17px] font-bold tracking-[-0.02em] sm:mr-5" aria-label="Spawnswap home">
              <span aria-hidden className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-marquee font-display text-[13px] font-bold text-ink">S</span>
              <span className="hidden min-[420px]:inline">Spawnswap</span>
            </Link>
            <NavLinks />
            <div className="ml-auto flex items-center gap-1 text-sm sm:gap-2">
              {user ? (
                <>
                  <Link href="/dashboard" className="hidden min-h-[40px] items-center px-2 text-mute transition hover:text-cream md:flex">My Games</Link>
                  <CreditCounter value={user.credits} />
                  <details className="group relative">
                    <summary className="flex min-h-[40px] cursor-pointer list-none items-center gap-1 rounded-full pl-1 pr-1.5 [&::-webkit-details-marker]:hidden" aria-label="Account menu">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-line text-sm font-semibold text-cream">
                        {(user.robloxUsername ?? user.displayName ?? user.email).charAt(0).toUpperCase()}
                      </span>
                      <ChevronDown className="h-4 w-4 text-mute transition group-open:rotate-180" />
                    </summary>
                    <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-ctl border border-line bg-panel py-1 text-sm shadow-[0_12px_32px_rgba(0,0,0,.45)]">
                      <Link href="/dashboard" className="block px-4 py-2.5 hover:bg-line">My Games</Link>
                      <Link href="/dashboard/billing" className="block px-4 py-2.5 hover:bg-line">Credits</Link>
                      <Link href="/dashboard/account" className="block px-4 py-2.5 hover:bg-line">Account</Link>
                      <form action="/api/logout" method="post" className="border-t border-line">
                        <button className="block w-full px-4 py-2.5 text-left text-mute hover:bg-line hover:text-cream">Log Out</button>
                      </form>
                    </div>
                  </details>
                </>
              ) : (
                <>
                  <Link href="/login" className="min-h-[40px] whitespace-nowrap px-2 leading-[40px] text-mute transition hover:text-cream sm:px-3">Log In</Link>
                  <Link href="/signup" className="btn whitespace-nowrap px-3 sm:px-4">Get players</Link>
                </>
              )}
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8 sm:py-12">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 pb-10 pt-8">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/[.06] pt-6 text-xs text-faint">
            <span>© {new Date().getFullYear()} Spawnswap. Not affiliated with Roblox Corporation.</span>
            <span className="hidden h-3 w-px bg-line sm:block" aria-hidden />
            <Link href="/how-it-works" className="transition hover:text-cream">How It Works</Link>
            <Link href="/terms" className="transition hover:text-cream">Terms</Link>
            <Link href="/privacy" className="transition hover:text-cream">Privacy</Link>
            <Link href="/privacy#cookies" className="transition hover:text-cream">Cookies</Link>
            <Link href="/refund" className="transition hover:text-cream">Refunds</Link>
            <Link href="/contact" className="transition hover:text-cream">Contact</Link>
            <span className="sm:ml-auto">For ages 13+.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
