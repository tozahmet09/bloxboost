"use client";

import { Ticket } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

/** The one fixed place credits live. Counts up and pops when the balance grows. */
export function CreditCounter({ value }: { value: number }) {
  const [shown, setShown] = useState(value);
  const [gain, setGain] = useState<{ n: number; key: number } | null>(null);
  const prev = useRef(value);

  useEffect(() => {
    const from = prev.current;
    prev.current = value;
    if (value <= from) return setShown(value);
    setGain({ n: value - from, key: Date.now() });
    const start = performance.now();
    const dur = Math.min(900, 250 + (value - from) * 10);
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setShown(Math.round(from + (value - from) * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return (
    <Link
      href="/dashboard/billing"
      className="relative inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-line px-3 text-sm font-semibold tabular-nums transition hover:border-faint"
      aria-label={`${value} credits`}
    >
      <Ticket key={gain?.key} className={`h-4 w-4 text-coral ${gain ? "animate-pop" : ""}`} />
      {shown}
      {gain && (
        <span key={gain.key} className="pointer-events-none absolute -bottom-1 right-1 animate-rise font-display text-sm text-coral">
          +{gain.n}
        </span>
      )}
    </Link>
  );
}
