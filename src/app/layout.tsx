import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import { Box, ChevronDown } from "lucide-react";
import { NavLinks } from "@/components/NavLinks";
import "./globals.css";
import { getUser } from "@/lib/auth";
import { CreditCounter } from "@/components/CreditCounter";
import { Particles } from "@/components/Particles";
import { SoundToggle } from "@/components/Sfx";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

// One sans for everything (headlines are just tighter and heavier), plus a mono for numbers, counts and small labels.
const body = Geist({ subsets: ["latin"], variable: "--font-body" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });
// Chunky rounded-geometric headlines, to match the blocky game look.
const display = Outfit({ subsets: ["latin"], weight: ["600", "700", "800", "900"], variable: "--font-display" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || "https://spawnswap.com"),
  title: { default: "Spawnswap: new Roblox games, before they blow up", template: "%s · Spawnswap" },
  description: "Watch trailers of brand-new Roblox games. Developers: get your first 100 real players, verified in-game.",
  twitter: { card: "summary_large_image" },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  return (
    <html lang="en" className={`${body.variable} ${mono.variable} ${display.variable}`}>
      <body>
        {/* The voxel night world: fixed behind every page, edges only (the middle of the picture is empty sky). */}
        <div aria-hidden className="pointer-events-none fixed inset-0 z-0 bg-navy bg-[url(/world.webp)] bg-cover bg-top bg-no-repeat max-sm:opacity-60" />
        {/* Dims the art behind the content column so text stays easy to read; the world shows fully at the sides. */}
        <div aria-hidden className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(90deg,transparent_0%,rgba(6,20,39,.72)_20%,rgba(6,20,39,.72)_80%,transparent_100%)]" />
        <Particles />
        <header className="sticky top-0 z-30 border-b border-white/[.08] bg-navy/60 backdrop-blur-xl backdrop-saturate-150">
          <nav className="mx-auto flex h-14 max-w-6xl items-center gap-1 px-4 sm:gap-2">
            <Link href="/" className="mr-1 flex items-center gap-2 font-display text-[19px] font-extrabold tracking-[-0.02em] sm:mr-5" aria-label="Spawnswap home">
              <span aria-hidden className="flex h-7 w-7 rotate-[-12deg] items-center justify-center rounded-[6px] bg-lime shadow-[0_0_14px_rgba(200,240,49,.6)]"><Box className="h-4 w-4 text-navy" strokeWidth={2.5} /></span>
              <span className="hidden min-[420px]:inline">Spawnswap</span>
            </Link>
            <NavLinks />
            <div className="ml-auto flex items-center gap-1 text-sm sm:gap-2">
              <SoundToggle />
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
        <main className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:py-12">{children}</main>
        <footer className="relative z-10 bg-navy-deep text-faint">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 border-t border-line px-4 pb-10 pt-8 text-xs">
            <span>© {new Date().getFullYear()} Spawnswap. Not affiliated with Roblox Corporation.</span>
            <span className="hidden h-3 w-px bg-line sm:block" aria-hidden />
            <Link href="/how-it-works" className="transition hover:text-cream">How It Works</Link>
            <Link href="/guides" className="transition hover:text-cream">Guides</Link>
            <Link href="/terms" className="transition hover:text-cream">Terms</Link>
            <Link href="/privacy" className="transition hover:text-cream">Privacy</Link>
            <Link href="/privacy#cookies" className="transition hover:text-cream">Cookies</Link>
            <Link href="/refund" className="transition hover:text-cream">Refunds</Link>
            <Link href="/contact" className="transition hover:text-cream">Contact</Link>
            <span className="sm:ml-auto">For ages 13+.</span>
          </div>
        </footer>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
