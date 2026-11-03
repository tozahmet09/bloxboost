import Link from "next/link";

type Props = { id: string; name: string; iconUrl: string | null; playing: number; genre: string; featured?: boolean };

export function GameIcon({ url, className = "" }: { url: string | null; className?: string }) {
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" className={`object-cover ${className}`} loading="lazy" />
  ) : (
    <div className={`flex items-center justify-center bg-slate-800 text-3xl ${className}`}>🎮</div>
  );
}

export function GameCard({ id, name, iconUrl, playing, genre, featured }: Props) {
  return (
    <Link href={`/go/${id}`} prefetch={false} target="_blank" rel="noopener"
      className="card group block overflow-hidden transition hover:border-brand">
      <div className="relative aspect-square">
        <GameIcon url={iconUrl} className="h-full w-full" />
        {featured && (
          <span className="absolute left-2 top-2 rounded-md bg-slate-950/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand">
            Featured
          </span>
        )}
      </div>
      <div className="p-3">
        <div className="truncate font-semibold group-hover:text-brand">{name}</div>
        <div className="mt-1 flex justify-between text-xs text-slate-400">
          <span>{genre}</span>
          <span>{playing.toLocaleString()} playing</span>
        </div>
      </div>
    </Link>
  );
}
