import { Gamepad2 } from "lucide-react";

export function GameIcon({ url, className = "" }: { url: string | null; className?: string }) {
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" className={`object-cover ${className}`} loading="lazy" />
  ) : (
    <div className={`flex items-center justify-center bg-panel text-mute ${className}`}>
      <Gamepad2 className="h-1/3 w-1/3" strokeWidth={1.5} />
    </div>
  );
}
