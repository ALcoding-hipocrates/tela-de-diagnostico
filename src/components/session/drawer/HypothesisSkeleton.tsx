export function HypothesisSkeleton() {
  return (
    <div
      aria-hidden
      className="overflow-hidden rounded-lg border border-black/[0.06] bg-surface px-3 py-2.5 shadow-[var(--shadow-card-raised)]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="hp-shimmer h-4 w-20 rounded-full" />
          <div className="hp-shimmer h-4 w-3/4 rounded" />
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="hp-shimmer h-3 w-10 rounded" />
          <div className="hp-shimmer h-7 w-16 rounded" />
        </div>
      </div>
      <div className="mt-3 hp-shimmer h-8 w-full rounded" />
      <div className="mt-2 flex gap-1.5">
        <div className="hp-shimmer h-4 w-16 rounded-full" />
        <div className="hp-shimmer h-4 w-20 rounded-full" />
      </div>
    </div>
  );
}
