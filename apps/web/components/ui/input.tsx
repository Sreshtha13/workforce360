import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full rounded-lg border border-input bg-background/80 px-3 py-1 text-sm shadow-xs backdrop-blur-sm transition-all",
        "placeholder:text-muted-foreground",
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        "dark:border-white/10 dark:bg-white/5",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
