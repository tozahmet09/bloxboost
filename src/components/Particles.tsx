"use client";

import { useEffect, useState } from "react";

type P = { left: number; size: number; dur: number; delay: number; o: number; rot: number };

/**
 * Small lime cubes drifting up behind the page, like sparks in the voxel world.
 * Made after load (random positions would not match the server render), behind everything, never clickable.
 * Hidden for people who turned on "reduce motion".
 */
export function Particles({ count = 22 }: { count?: number }) {
  const [ps, setPs] = useState<P[]>([]);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setPs(
      Array.from({ length: count }, () => ({
        left: Math.random() * 100,
        size: 3 + Math.random() * 5,
        dur: 14 + Math.random() * 16,
        delay: -Math.random() * 30,
        o: 0.15 + Math.random() * 0.45,
        rot: Math.random() * 90,
      })),
    );
  }, [count]);
  if (!ps.length) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {ps.map((p, i) => (
        <span
          key={i}
          className="absolute -bottom-4 block rounded-[1px] bg-lime shadow-[0_0_8px_rgba(200,240,49,.8)]"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            rotate: `${p.rot}deg`,
            ["--o" as string]: p.o,
            animation: `drift ${p.dur}s linear ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
