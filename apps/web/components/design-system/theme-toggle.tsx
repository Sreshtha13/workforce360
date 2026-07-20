"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type Theme } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils";
import { iconSize } from "@/lib/design-system";
import { Button } from "@/components/ui/button";

const cycle: Theme[] = ["light", "dark", "system"];

const icons = {
  light: Sun,
  dark: Moon,
  system: Monitor,
} as const;

const labels = {
  light: "Light mode",
  dark: "Dark mode",
  system: "System theme",
} as const;

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const Icon = icons[theme];

  const handleClick = () => {
    const index = cycle.indexOf(theme);
    setTheme(cycle[(index + 1) % cycle.length]);
  };

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className={cn("relative", className)}
      onClick={handleClick}
      aria-label={labels[theme]}
      title={labels[theme]}
    >
      <Icon className={iconSize.md} />
    </Button>
  );
}
