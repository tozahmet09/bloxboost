import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center sm:py-24">
      <p className="font-display text-sm font-bold tabular-nums text-lime">404</p>
      <h1 className="page-title mt-2">This page doesn&apos;t exist.</h1>
      <p className="mt-2 text-mute">The game may have been removed, or the link is wrong.</p>
      <div className="mt-6 flex items-center justify-center gap-5">
        <Link href="/" className="btn">Browse games</Link>
        <Link href="/#earn-title" className="link">Play &amp; earn <ArrowRight className="h-3.5 w-3.5" /></Link>
      </div>
    </div>
  );
}
