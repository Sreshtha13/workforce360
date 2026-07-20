import { cn } from "@/lib/utils";
import { typographyScale } from "@/lib/design-tokens";
import { motion } from "@/lib/design-system";
import { Button } from "@/components/ui/button";

type PageHeaderProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
  children?: React.ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  description,
  actionLabel,
  onAction,
  actionDisabled,
  children,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        motion.fadeInDown,
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        <h1 className={cn(typographyScale.pageTitle.className)}>{title}</h1>
        {description && (
          <p className={cn(typographyScale.body.className, "text-muted-foreground")}>
            {description}
          </p>
        )}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {children}
        {actionLabel && onAction && (
          <Button onClick={onAction} disabled={actionDisabled} className="shadow-md shadow-primary/10">
            {actionLabel}
          </Button>
        )}
      </div>
    </header>
  );
}

/** @deprecated Use PageHeader — kept for admin imports */
export { PageHeader as AdminPageHeader };
