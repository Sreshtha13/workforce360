"use client";

import { type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { glass, iconSize } from "@/lib/design-system";
import { cn } from "@/lib/utils";

type FormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  onSubmit: () => void;
  submitLabel?: string;
  loading?: boolean;
  destructive?: boolean;
  /** Wider sheet for dense content (e.g. permission matrix). */
  size?: "default" | "wide";
};

export function FormSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSubmit,
  submitLabel = "Save",
  loading,
  destructive,
  size = "default",
}: FormSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn(
          glass.nav,
          "w-full border-l-0",
          size === "wide" ? "sm:max-w-4xl" : "sm:max-w-lg",
        )}
      >
        <SheetHeader className="border-b border-white/10 pb-4 dark:border-white/5">
          <SheetTitle className="text-lg">{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <form
          className="flex flex-1 flex-col gap-5 overflow-y-auto px-1 py-4"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          {children}
          <SheetFooter className="mt-auto flex-row justify-end gap-2 border-t border-white/10 pt-4 dark:border-white/5">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={destructive ? "destructive" : "default"}
              disabled={loading}
              className="min-w-[120px]"
            >
              {loading ? (
                <>
                  <Loader2 className={cn(iconSize.md, "animate-spin")} aria-hidden />
                  Saving...
                </>
              ) : (
                submitLabel
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
