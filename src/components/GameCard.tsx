import Link from "next/link";

type Props = {
  id: string;
  name: string;
  iconUrl: string | null;
  playing: number;
  genre: string;
  campaignId?: string;
};

export function GameCard({ id, name, iconUrl, playing, genre, campaignId }: Props) {
  const href = `/go/${id}${campaignId ? `?c=${campaignId}` : ""}`;
  return (
    <Link
      href={href}
      prefetch={false}
      target="_blank"
      rel="noopener"
      className="card group block overflow-hidden transition hover:border-brand"
    >
      <div className="relative aspect-square bg-slate-800">
        {iconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={iconUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl">🎮</div>
        )}
        {campaignId && (
          <span className="absolute left-2 top-2 rounded-md bg-slate-950/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand">
            Sponsored
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
