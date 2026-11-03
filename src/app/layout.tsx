import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "BloxBoost — discover new Roblox games",
  description: "Find fresh Roblox games before they blow up. Developers: promote your game for cents per click.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  return (
    <html lang="en">
      <body>
        <header className="border-b border-slate-800">
          <nav className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
            <Link href="/" className="text-lg font-extrabold">
              Blox<span className="text-brand">Boost</span>
            </Link>
            <div className="ml-auto flex items-center gap-2 text-sm">
              {user ? (
                <>
                  <Link href="/dashboard" className="btn-ghost">Dashboard</Link>
                  <form action="/api/logout" method="post">
                    <button className="btn-ghost">Log out</button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/login" className="btn-ghost">Log in</Link>
                  <Link href="/signup" className="btn">Promote your game</Link>
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
