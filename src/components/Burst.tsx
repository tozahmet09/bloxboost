import { SfxOnMount } from "./Sfx";

/** A short spark burst for reward moments. Pure CSS, removed by its parent after use. */
export function Burst({ label }: { label: string }) {
  const sparks = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    const r = 48 + (i % 3) * 14;
    return { dx: `${Math.cos(a) * r}px`, dy: `${Math.sin(a) * r}px`, d: `${(i % 4) * 40}ms` };
  });
  return (
    <div className="relative flex items-center justify-center py-6" role="status">
      <SfxOnMount name="ding" />
      {sparks.map((s, i) => (
        <span
          key={i}
          className="absolute h-1.5 w-1.5 animate-spark rounded-full bg-lime"
          style={{ ["--dx" as string]: s.dx, ["--dy" as string]: s.dy, animationDelay: s.d }}
        />
      ))}
      <span className="animate-pop font-display text-2xl font-bold text-lime">{label}</span>
    </div>
  );
}
