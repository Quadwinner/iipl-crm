import { Skeleton } from "@/site/ui/skeleton";

export const BlogCardSkeleton = () => (
  <div className="rounded-2xl border border-border bg-card overflow-hidden">
    <Skeleton className="w-full h-48" />
    <div className="p-5 space-y-3">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  </div>
);

export const PortfolioCardSkeleton = () => (
  <div className="rounded-2xl border border-border bg-card overflow-hidden">
    <Skeleton className="w-full h-56" />
    <div className="p-5 space-y-3">
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </div>
  </div>
);

export const JobCardSkeleton = () => (
  <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
    <div className="flex justify-between items-start">
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-8 w-20 rounded-full" />
    </div>
    <div className="flex gap-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-24" />
    </div>
    <div className="flex gap-2">
      <Skeleton className="h-6 w-16 rounded-full" />
      <Skeleton className="h-6 w-16 rounded-full" />
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  </div>
);

export const BlogGridSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <BlogCardSkeleton key={i} />
    ))}
  </div>
);

export const PortfolioGridSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <PortfolioCardSkeleton key={i} />
    ))}
  </div>
);

export const JobListSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <JobCardSkeleton key={i} />
    ))}
  </div>
);
