"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Tab = {
  value: string;
  label: string;
  content: ReactNode;
};

type SimpleTabsProps = {
  tabs: Tab[];
  defaultValue?: string;
  className?: string;
};

export function SimpleTabs({ tabs, defaultValue, className }: SimpleTabsProps) {
  const [active, setActive] = useState(defaultValue ?? tabs[0]?.value ?? "");

  const current = tabs.find((tab) => tab.value === active);

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2 border-b pb-2">
        {tabs.map((tab) => (
          <Button
            key={tab.value}
            type="button"
            size="sm"
            variant={active === tab.value ? "default" : "ghost"}
            onClick={() => setActive(tab.value)}
          >
            {tab.label}
          </Button>
        ))}
      </div>
      <div className={cn("mt-6")}>{current?.content}</div>
    </div>
  );
}
