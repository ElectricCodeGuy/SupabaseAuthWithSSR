export function ChatLayoutSkeleton() {
  return (
    <div className="h-[calc(100vh-48px)] sticky top-0 border border-[rgba(0,0,0,0.1)] w-0 md:w-[240px] lg:w-[280px] flex-shrink-0 bg-background flex flex-col">
      {/* Header skeleton */}
      <div className="p-1 space-y-2">
        {/* Mode toggle skeleton */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden w-full">
          <div className="h-8 flex-1 animate-pulse bg-muted" />
          <div className="h-8 flex-1 animate-pulse bg-muted/50" />
        </div>

        {/* New Chat button skeleton */}
        <div className="h-9 w-full animate-pulse rounded-md bg-muted" />
      </div>

      {/* Content skeleton */}
      <div className="flex-1 border-t border-gray-200 overflow-y-auto p-2 space-y-1">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="h-12 w-full animate-pulse rounded-md bg-muted"
          />
        ))}
      </div>

      {/* Footer skeleton */}
      <div className="p-2">
        <div className="h-10 w-full animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  );
}
