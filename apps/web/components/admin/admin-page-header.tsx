import { cn } from "@/lib/utils";
import { typographyScale } from "@/lib/design-tokens";
import { Button } from "@/components/ui/button";

type AdminPageHeaderProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
  children?: React.ReactNode;
};

export function AdminPageHeader({
  title,
  description,
  actionLabel,
  onAction,
  actionDisabled,
  children,
}: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className={typographyScale.title.className}>{title}</h1>
        {description && (
          <p className={cn(typographyScale.body.className, "mt-2 text-muted-foreground")}>
            {description}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {children}
        {actionLabel && onAction && (
          <Button onClick={onAction} disabled={actionDisabled}>
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
