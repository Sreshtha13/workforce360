import { type LucideIcon, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { glass, motion } from "@/lib/design-system";
import { typographyScale } from "@/lib/design-tokens";
import { Button } from "@/components/ui/button";

type EmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: LucideIcon;
  className?: string;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon: Icon = Inbox,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        glass.panel,
        motion.scaleIn,
        "flex flex-col items-center justify-center px-6 py-16 text-center",
        className,
      )}
    >
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted/60 ring-1 ring-white/20 dark:ring-white/10">
        <Icon className="size-6 text-muted-foreground" aria-hidden />
      </div>
      <p className={cn(typographyScale.cardTitle.className)}>{title}</p>
      {description && (
        <p className={cn(typographyScale.caption.className, "mt-2 max-w-sm")}>
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button className="mt-6" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
