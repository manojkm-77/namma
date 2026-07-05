interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-slate-200 ${className}`}
    />
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      <div className="flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={`h-${i}`} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={`r-${r}`} className="flex gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={`c-${r}-${c}`} className="h-6 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function StatsCardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-8 w-20 mb-2" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
}
