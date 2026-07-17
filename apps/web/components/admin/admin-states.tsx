import { cn } from "@/lib/utils";
import { typographyScale } from "@/lib/design-tokens";
import { Button } from "@/components/ui/button";

type AlertBannerProps = {
  variant?: "error" | "success" | "info";
  message: string;
  onDismiss?: () => void;
};

export function AlertBanner({
  variant = "info",
  message,
  onDismiss,
}: AlertBannerProps) {
  const styles = {
    error: "bg-red-50 text-red-800 border-red-200",
    success: "bg-green-50 text-green-800 border-green-200",
    info: "bg-blue-50 text-blue-800 border-blue-200",
  };

  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 rounded-md border p-3 text-sm",
        styles[variant],
      )}
    >
      <p>{message}</p>
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

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-border p-12 text-center">
      <p className={typographyScale.body.className}>{title}</p>
      {description && (
        <p className={cn(typographyScale.caption.className, "mt-1 text-muted-foreground")}>
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button className="mt-4" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export function LoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-border bg-card">
      <p className={typographyScale.body.className}>{message}</p>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-md border border-red-200 bg-red-50 p-4">
      <p className="text-sm text-red-800">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
