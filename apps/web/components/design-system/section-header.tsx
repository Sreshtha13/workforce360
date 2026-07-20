import { cn } from "@/lib/utils";
import { typographyScale } from "@/lib/design-tokens";
import { motion } from "@/lib/design-system";

type SectionHeaderProps = {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
};

export function SectionHeader({
  title,
  description,
  children,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        motion.fadeIn,
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div>
        <h2 className={typographyScale.sectionTitle.className}>{title}</h2>
        {description && (
          <p className={cn(typographyScale.body.className, "mt-1 text-muted-foreground")}>
            {description}
          </p>
        )}
      </div>
      {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
    </div>
  );
}
