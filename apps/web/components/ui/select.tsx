import * as React from "react";
import { cn } from "@/lib/utils";

function Select({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "flex h-9 w-full rounded-lg border border-input bg-background/80 px-3 py-1 text-sm shadow-xs backdrop-blur-sm transition-all",
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "dark:border-white/10 dark:bg-white/5",
        className,
      )}
      {...props}
    />
  );
}

export { Select };
