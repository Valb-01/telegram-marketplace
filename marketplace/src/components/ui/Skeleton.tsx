export function ProductCardSkeleton() {
  return (
    <div className="bg-bg-card rounded-2xl overflow-hidden border border-white/5 animate-pulse">
      <div className="aspect-video skeleton" />
      <div className="p-3 space-y-2">
        <div className="h-4 skeleton rounded w-3/4" />
        <div className="h-3 skeleton rounded w-full" />
        <div className="h-3 skeleton rounded w-2/3" />
        <div className="flex justify-between items-center mt-3">
          <div className="h-5 skeleton rounded w-16" />
          <div className="h-8 skeleton rounded-xl w-20" />
        </div>
      </div>
    </div>
  );
}

export function TextSkeleton({ width = 'full', height = 4 }: { width?: string; height?: number }) {
  return <div className={`h-${height} skeleton rounded w-${width}`} />;
}
