"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** A row that scrolls sideways (swipe, trackpad, or the arrow buttons). Shows 4 items on laptops. */
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
        className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:scroll-px-0 sm:px-0 [&::-webkit-scrollbar]:hidden [&>*]:w-[46%] [&>*]:shrink-0 [&>*]:snap-start sm:[&>*]:w-[calc((100%-1.5rem)/3)] lg:[&>*]:w-[calc((100%-2.25rem)/4)]"
      >
        {children}
      </div>
      {can.left && (
        <button onClick={() => go(-1)} aria-label="Scroll left" className="absolute -left-4 top-[28%] hidden h-10 w-10 items-center justify-center rounded-full bg-cream text-ink shadow-xl transition hover:scale-105 sm:flex">
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      {can.right && (
        <button onClick={() => go(1)} aria-label="Scroll right" className="absolute -right-4 top-[28%] hidden h-10 w-10 items-center justify-center rounded-full bg-cream text-ink shadow-xl transition hover:scale-105 sm:flex">
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
