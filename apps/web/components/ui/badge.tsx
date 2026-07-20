import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        success:
          "border-emerald-200/60 bg-emerald-50 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-300",
        warning:
          "border-amber-200/60 bg-amber-50 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-300",
        destructive:
          "border-rose-200/60 bg-rose-50 text-rose-800 dark:border-rose-500/20 dark:bg-rose-500/15 dark:text-rose-300",
        info:
          "border-blue-200/60 bg-blue-50 text-blue-800 dark:border-blue-500/20 dark:bg-blue-500/15 dark:text-blue-300",
        outline: "border-border/60 bg-background/50 text-foreground",
        soft: "border-transparent bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
