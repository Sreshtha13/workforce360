import { cn } from "@/lib/utils";
import { glass } from "@/lib/design-system";

type GlassCardProps = React.ComponentProps<"div"> & {
  interactive?: boolean;
  variant?: "default" | "subtle";
};

export function GlassCard({
  className,
  interactive = false,
  variant = "default",
  children,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        variant === "subtle" ? glass.panelSubtle : glass.panel,
        interactive && glass.interactive,
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
