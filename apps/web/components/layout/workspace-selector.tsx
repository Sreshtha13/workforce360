"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, ChevronDown, Building2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { glass, iconSize } from "@/lib/design-system";
import { cn } from "@/lib/utils";

export function WorkspaceSelector() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (!user) return null;

  const workspaceName = user.department?.name ?? "Organization";
  const workspaceSubtitle = user.office?.name ?? "Default workspace";

  return (
    <div ref={ref} className="relative px-3 pb-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          glass.panelSubtle,
          "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-white/50 dark:hover:bg-white/10",
        )}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Workspace selector"
      >
        <span className="flex items-center gap-2 min-w-0">
          <Sparkles className={cn(iconSize.sm, "text-brand-600 dark:text-brand-400 shrink-0")} />
          <span className="min-w-0">
            <span className="block font-medium truncate">{workspaceName}</span>
            <span className="block text-xs text-muted-foreground truncate">{workspaceSubtitle}</span>
          </span>
        </span>
        <ChevronDown
          className={cn(iconSize.sm, "text-muted-foreground shrink-0 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-3 right-3 top-full z-50 mt-1 rounded-xl border bg-popover p-1 shadow-lg"
        >
          <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Workspaces</p>
          <div
            role="option"
            aria-selected
            className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm bg-muted/50"
          >
            <Building2 className={iconSize.sm} />
            <span className="flex flex-col min-w-0">
              <span className="truncate">{workspaceName}</span>
              <span className="text-xs text-muted-foreground">Current</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
