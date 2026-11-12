import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GUIDES } from "@/lib/guides";

export const metadata: Metadata = {
  title: "Guides for Roblox developers",
  description: "Free guides for small Roblox developers: how to get your first players, honest feedback, and promotion with no budget.",
  alternates: { canonical: "/guides" },
};

export default function Guides() {
  return (
    <article className="mx-auto max-w-3xl">
      <header>
        <p className="eyebrow">Guides</p>
        <h1 className="mt-2 text-[32px] font-bold leading-[1.08] sm:text-[42px]">Get your Roblox game played.</h1>
        <p className="mt-3 max-w-2xl text-mute">Short, practical guides for small developers. Free, no sign-up.</p>
      </header>
      <ul className="mt-10 divide-y divide-line border-y border-line">
        {GUIDES.map((g) => (
          <li key={g.slug}>
            <Link href={`/guides/${g.slug}`} className="group flex items-start justify-between gap-6 py-5">
              <div>
                <h2 className="font-semibold transition group-hover:text-lime">{g.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-mute">{g.description}</p>
              </div>
              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-mute transition group-hover:text-lime" />
            </Link>
          </li>
        ))}
      </ul>
    </article>
  );
}
