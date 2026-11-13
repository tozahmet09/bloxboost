"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS: { href: string; label: string; short?: string; desktopOnly?: boolean }[] = [
  { href: "/", label: "Home", desktopOnly: true },
  { href: "/play", label: "Progress" },
  { href: "/leaderboard", label: "Leaderboard", short: "Top" },
  { href: "/how-it-works", label: "How it works", desktopOnly: true },
];

/** Main nav: plain text links. The current page is bright with a thin amber line under it. */
export function NavLinks() {
  const path = usePathname();
  return (
    <>
      {LINKS.map(({ href, label, short, desktopOnly }) => {
        const on = href === "/" ? path === "/" : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={on ? "page" : undefined}
            className={`${desktopOnly ? "hidden sm:flex" : "flex"} relative h-14 items-center whitespace-nowrap px-2 text-sm transition sm:px-3 ${
              on ? "font-semibold text-lime" : "text-cream/80 hover:text-cream"
            }`}
          >
            {short ? <><span className="sm:hidden">{short}</span><span className="hidden sm:inline">{label}</span></> : label}
            {on && <span aria-hidden className="absolute inset-x-2 bottom-0 h-[3px] rounded-full bg-lime shadow-[0_0_12px_rgba(200,240,49,.8)] sm:inset-x-3" />}
          </Link>
        );
      })}
    </>
  );
}
