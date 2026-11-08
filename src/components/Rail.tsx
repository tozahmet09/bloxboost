"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * A row that scrolls sideways (swipe, trackpad, or the arrow buttons). Laptop: 4 items plus the edge of the 5th,
 * and the row runs off the right edge of the screen so it reads as a world that keeps going.
 */
export function Rail({ children, label }: { children: React.ReactNode; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [can, setCan] = useState({ left: false, right: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setCan({ left: el.scrollLeft > 4, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const go = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.9, behavior: "smooth" });

  return (
    <div className="relative">
      <div
        ref={ref}
        role="region"
        aria-label={label}
        className="-mx-4 -my-3 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 py-3 [scrollbar-width:none] sm:mx-0 sm:scroll-px-0 sm:px-0 lg:mr-[calc(-1*var(--bleed))] lg:pr-[var(--bleed)] [&::-webkit-scrollbar]:hidden [&>*]:w-[62%] min-[480px]:[&>*]:w-[44%] [&>*]:shrink-0 [&>*]:snap-start sm:[&>*]:w-[calc((100%-3rem)/3.25)] lg:[&>*]:w-[calc((var(--box)-3rem)/4.25)]"
        style={{ "--bleed": "max(1rem, calc((100vw - 72rem) / 2 + 1rem))", "--box": "calc(min(100vw, 72rem) - 2rem)" } as React.CSSProperties}
      >
        {children}
      </div>
      {can.left && (
        <button onClick={() => go(-1)} aria-label="Scroll left" className="absolute -left-4 top-[calc(36%-4px)] z-10 shadow-lift hidden h-9 w-9 items-center justify-center rounded-full bg-cream text-navy transition hover:bg-white sm:flex">
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      {can.right && (
        <button onClick={() => go(1)} aria-label="Scroll right" className="absolute -right-4 top-[calc(36%-4px)] z-10 shadow-lift hidden h-9 w-9 items-center justify-center rounded-full bg-cream text-navy transition hover:bg-white sm:flex">
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
