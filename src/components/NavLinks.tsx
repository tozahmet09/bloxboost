"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clapperboard, Gamepad2, Info, Trophy } from "lucide-react";

const LINKS = [
  { href: "/", label: "Discover", short: "Discover", icon: Clapperboard, desktopOnly: true },
  { href: "/play", label: "Play & Earn", short: "Play", icon: Gamepad2 },
  { href: "/leaderboard", label: "Top", short: "Top", icon: Trophy },
  { href: "/how-it-works", label: "How It Works", short: "How it works", icon: Info, desktopOnly: true },
];

/** Main nav. The current page gets a raised pill and an amber icon. */
export function NavLinks() {
  const path = usePathname();
  return (
    <>
      {LINKS.map(({ href, label, short, icon: Icon, desktopOnly }) => {
        const on = href === "/" ? path === "/" : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={on ? "page" : undefined}
            className={`${desktopOnly ? "hidden sm:flex" : "flex"} min-h-[40px] items-center gap-2 whitespace-nowrap rounded-ctl px-2.5 text-sm transition sm:px-3 ${
              on ? "bg-panel font-semibold text-cream ring-1 ring-line" : "text-mute hover:text-cream"
            }`}
          >
            <Icon className={`h-4 w-4 ${on ? "text-marquee" : ""} ${href === "/play" ? "hidden sm:block" : ""}`} />
            <span className="hidden sm:inline">{label}</span>
            <span className={href === "/leaderboard" ? "sr-only" : "sm:hidden"}>{short}</span>
          </Link>
        );
      })}
    </>
  );
}
