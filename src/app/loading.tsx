/** Skeleton in the shape of the real page (title, then a row of 16:9 tiles), never a spinner. */
export default function Loading() {
  return (
    <div className="animate-pulse space-y-14" aria-busy="true" aria-label="Loading">
      <div className="space-y-3">
        <div className="h-9 w-2/3 max-w-md rounded-md bg-panel" />
        <div className="h-4 w-1/2 max-w-sm rounded bg-panel" />
      </div>
      {[0, 1].map((r) => (
        <div key={r} className="space-y-5">
          <div className="h-5 w-48 rounded bg-panel" />
          <div className="flex gap-4 overflow-hidden">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="w-[62%] shrink-0 space-y-2.5 min-[480px]:w-[44%] sm:w-[calc((100%-3rem)/3.25)] lg:w-[calc((100%-4rem)/4.25)]">
                <div className="aspect-video rounded-media bg-panel" />
                <div className="h-3.5 w-2/3 rounded bg-panel" />
                <div className="h-3 w-1/3 rounded bg-panel" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
