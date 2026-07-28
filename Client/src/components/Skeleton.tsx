import clsx from "clsx";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={clsx("animate-pulse rounded bg-gray-200", className)} />
  );
}

export function NewsCardSkeleton() {
  return (
    <article className="overflow-hidden rounded-lg bg-white shadow-card">
      <Skeleton className="aspect-[16/10] rounded-none" />
      <div className="space-y-3 p-7">
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </article>
  );
}

export function NewsCardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-8 md:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <NewsCardSkeleton key={i} />
      ))}
    </div>
  );
}
