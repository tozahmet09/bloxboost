"use client";

import { Star } from "lucide-react";
import { useState } from "react";

export function StarPicker({ name }: { name: string }) {
  const [value, setValue] = useState(0);
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Rating" onMouseLeave={() => setHover(0)}>
      <input type="hidden" name={name} value={value || ""} />
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          onClick={() => setValue(n)}
          onMouseEnter={() => setHover(n)}
          className="flex h-11 w-11 items-center justify-center rounded-ctl transition active:scale-90"
        >
          <Star className={`h-7 w-7 transition ${n <= shown ? "scale-110 fill-coral text-coral" : "text-line"}`} />
        </button>
      ))}
    </div>
  );
}
