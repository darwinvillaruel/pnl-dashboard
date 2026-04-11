function Shimmer({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`rounded-md ${className ?? ""}`}
      style={{
        background: "linear-gradient(90deg, #1a2236 25%, #212d44 50%, #1a2236 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 2s infinite linear",
        ...style,
      }}
    />
  );
}

export function SkeletonKPICards() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-slate-700/30 bg-slate-800/30 p-5"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Shimmer className="h-3 w-28 mb-3" />
              <Shimmer className="h-8 w-20" />
            </div>
            <Shimmer className="h-10 w-10 rounded-xl" />
          </div>
          <Shimmer className="mt-4 h-0.5 w-full" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="rounded-2xl border border-slate-700/40 bg-surface-800/60 p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <Shimmer className="h-5 w-40 mb-2" />
          <Shimmer className="h-3 w-56" />
        </div>
        <div className="flex gap-4">
          <Shimmer className="h-3 w-12" />
          <Shimmer className="h-3 w-10" />
          <Shimmer className="h-3 w-14" />
        </div>
      </div>
      {/* Bar chart skeleton */}
      <div className="flex items-end gap-1.5 h-[280px] px-2 pb-6 pt-4">
        {Array.from({ length: 22 }, (_, i) => (
          <div key={i} className="flex-1 flex flex-col justify-end">
            <Shimmer
              className="w-full"
              style={{ height: `${20 + Math.sin(i * 0.8) * 15 + Math.random() * 40}%` } as React.CSSProperties}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonVerticalCard() {
  return (
    <div className="rounded-2xl border border-slate-700/30 bg-slate-800/30 p-4">
      <div className="flex items-center gap-4">
        <Shimmer className="h-10 w-10 rounded-xl shrink-0" />
        <div className="flex-1 min-w-0">
          <Shimmer className="h-4 w-48 mb-2" />
          <Shimmer className="h-3 w-24" />
        </div>
        <div className="hidden sm:flex gap-6">
          {[0, 1, 2].map((j) => (
            <div key={j} className="text-right">
              <Shimmer className="h-3 w-16 mb-1.5 ml-auto" />
              <Shimmer className="h-5 w-12 ml-auto" />
            </div>
          ))}
        </div>
        <Shimmer className="h-8 w-8 rounded-lg shrink-0" />
      </div>
    </div>
  );
}
