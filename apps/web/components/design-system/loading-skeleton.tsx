import { cn } from "@/lib/utils";
import { glass, motion } from "@/lib/design-system";
import { Skeleton } from "@/components/ui/skeleton";

type LoadingSkeletonProps = {
  variant?: "page" | "table" | "card" | "form";
  rows?: number;
  className?: string;
};

export function LoadingSkeleton({
  variant = "page",
  rows = 5,
  className,
}: LoadingSkeletonProps) {
  if (variant === "table") {
    return (
      <div className={cn(glass.panel, "overflow-hidden p-0", className)}>
        <div className="border-b border-white/10 p-4 dark:border-white/5">
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="space-y-0 divide-y divide-white/10 dark:divide-white/5">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <Skeleton className="size-9 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className={cn(glass.panel, "space-y-4 p-6", className)}>
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  if (variant === "form") {
    return (
      <div className={cn("space-y-4", className)}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="space-y-2">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <LoadingSkeleton variant="table" rows={rows} />
    </div>
  );
}

export function LoadingState({
  message = "Loading...",
  variant = "page",
}: {
  message?: string;
  variant?: "page" | "table" | "card" | "form";
}) {
  return (
    <div className={cn(glass.panel, motion.fadeIn, "p-6 md:p-8")}>
      <LoadingSkeleton variant={variant} />
      {message && (
        <p className="mt-4 text-center text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  );
}
