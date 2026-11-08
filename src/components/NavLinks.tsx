"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Discover", desktopOnly: true },
  { href: "/play", label: "Play & Earn" },
  { href: "/leaderboard", label: "Top" },
  { href: "/how-it-works", label: "How It Works", desktopOnly: true },
];

/** Main nav: plain text links. The current page is bright with a thin amber line under it. */
export function NavLinks() {
  const path = usePathname();
  return (
    <>
      {LINKS.map(({ href, label, desktopOnly }) => {
        const on = href === "/" ? path === "/" : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={on ? "page" : undefined}
            className={`${desktopOnly ? "hidden sm:flex" : "flex"} relative h-14 items-center whitespace-nowrap px-2 text-sm transition sm:px-3 ${
              on ? "font-semibold text-cream" : "text-mute hover:text-cream"
            }`}
          >
            {label}
            {on && <span aria-hidden className="absolute inset-x-2 bottom-0 h-[2px] rounded-full bg-coral sm:inset-x-3" />}
          </Link>
        );
      })}
    </>
  );
}
