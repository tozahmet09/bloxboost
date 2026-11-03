import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "BloxBoost: real players for new Roblox games",
  description: "Play other devs' games to earn players for yours. Or grab a $5 pack. Every player is verified in-game.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  return (
    <html lang="en">
      <body>
        <header className="border-b border-slate-800">
          <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-3 text-sm">
            <Link href="/" className="mr-4 text-lg font-extrabold">
              Blox<span className="text-brand">Boost</span>
            </Link>
            <Link href="/play" className="btn-ghost">Play &amp; earn</Link>
            <div className="ml-auto flex items-center gap-2">
              {user ? (
                <>
                  <Link href="/dashboard/billing" className="rounded-xl bg-slate-800 px-3 py-2 font-semibold">
                    ⭐ {user.credits} credits
                  </Link>
                  <Link href="/dashboard" className="btn-ghost">My games</Link>
                  <form action="/api/logout" method="post">
                    <button className="btn-ghost">Log out</button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/login" className="btn-ghost">Log in</Link>
                  <Link href="/signup" className="btn">Get players</Link>
                </>
              )}
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 py-10 text-xs text-slate-500">
          Not affiliated with Roblox Corporation. Game data comes from Roblox&apos;s public APIs.
        </footer>
      </body>
    </html>
  );
}
