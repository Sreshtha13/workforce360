import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { iconSize } from "@/lib/design-system";
import { Input } from "@/components/ui/input";

type SearchBarProps = React.ComponentProps<typeof Input> & {
  containerClassName?: string;
};

export function SearchBar({
  className,
  containerClassName,
  placeholder = "Search...",
  ...props
}: SearchBarProps) {
  return (
    <div className={cn("relative min-w-0", containerClassName)}>
      <Search
        className={cn(
          iconSize.md,
          "pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground",
        )}
        aria-hidden
      />
      <Input
        placeholder={placeholder}
        className={cn(
          "border-white/20 bg-white/50 pl-9 backdrop-blur-sm dark:border-white/10 dark:bg-white/5",
          className,
        )}
        {...props}
      />
    </div>
  );
}
