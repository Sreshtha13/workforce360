import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { statusSurface } from "@/lib/design-system";
import { Button } from "@/components/ui/button";
import { EmptyState as DSEmptyState } from "@/components/design-system/empty-state";
import { LoadingState, LoadingSkeleton } from "@/components/design-system/loading-skeleton";

type AlertBannerProps = {
  variant?: "error" | "success" | "info";
  message: string;
  onDismiss?: () => void;
};

const alertStyles = {
  error: statusSurface.error,
  success: statusSurface.success,
  info: statusSurface.info,
} as const;

const alertIcons = {
  error: AlertCircle,
  success: CheckCircle2,
  info: Info,
} as const;

export function AlertBanner({
  variant = "info",
  message,
  onDismiss,
}: AlertBannerProps) {
  const Icon = alertIcons[variant];

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-xl p-4 text-sm",
        alertStyles[variant],
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p className="flex-1 leading-relaxed">{message}</p>
      {onDismiss && (
        <Button variant="ghost" size="xs" onClick={onDismiss}>
          Dismiss
        </Button>
      )}
    </div>
  );
}

type EmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState(props: EmptyStateProps) {
  return <DSEmptyState {...props} />;
}

export { LoadingState, LoadingSkeleton };

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className={cn("rounded-xl p-4", statusSurface.error)}>
      <p className="text-sm leading-relaxed">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
