"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { glass, iconSize } from "@/lib/design-system";
import { Button } from "@/components/ui/button";

export type ToastVariant = "success" | "error" | "warning" | "info";

type ToastItem = {
  id: string;
  variant: ToastVariant;
  message: string;
};

type ToastContextValue = {
  toast: (options: { message: string; variant?: ToastVariant }) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const variantStyles: Record<ToastVariant, string> = {
  success: "border-emerald-200/60 bg-emerald-50/95 text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-200",
  error: "border-rose-200/60 bg-rose-50/95 text-rose-900 dark:border-rose-500/20 dark:bg-rose-500/15 dark:text-rose-200",
  warning: "border-amber-200/60 bg-amber-50/95 text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-200",
  info: "border-blue-200/60 bg-blue-50/95 text-blue-900 dark:border-blue-500/20 dark:bg-blue-500/15 dark:text-blue-200",
};

const variantIcons = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertCircle,
  info: Info,
} as const;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ message, variant = "info" }: { message: string; variant?: ToastVariant }) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, variant, message }]);
      window.setTimeout(() => dismiss(id), 5000);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-relevant="additions"
        className="pointer-events-none fixed top-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2"
      >
        {toasts.map((item) => {
          const Icon = variantIcons[item.variant];
          return (
            <div
              key={item.id}
              role="status"
              className={cn(
                glass.panel,
                "pointer-events-auto flex items-start gap-3 p-4 text-sm shadow-xl",
                variantStyles[item.variant],
              )}
            >
              <Icon className={cn(iconSize.md, "mt-0.5 shrink-0")} aria-hidden />
              <p className="flex-1 leading-relaxed">{item.message}</p>
              <Button
                variant="ghost"
                size="icon-xs"
                className="shrink-0 opacity-70 hover:opacity-100"
                onClick={() => dismiss(item.id)}
                aria-label="Dismiss notification"
              >
                <X className={iconSize.sm} />
              </Button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
