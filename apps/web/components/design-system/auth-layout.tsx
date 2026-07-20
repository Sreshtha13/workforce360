import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { glass, motion } from "@/lib/design-system";
import { typographyScale } from "@/lib/design-tokens";

type AuthLayoutProps = {
  children: ReactNode;
  title: string;
  subtitle?: string;
};

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="auth-canvas flex min-h-screen items-center justify-center p-4 md:p-8">
      <div className={cn("w-full max-w-md space-y-8", motion.fadeInUp)}>
        <div className="text-center">
          <div className="mb-5 flex justify-center">
            <span className="inline-flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 text-2xl font-bold text-white shadow-xl shadow-brand-600/30 ring-1 ring-white/20">
              W
            </span>
          </div>
          <h1 className={typographyScale.display.className}>{title}</h1>
          {subtitle && (
            <p className={cn(typographyScale.body.className, "mt-2 text-muted-foreground")}>
              {subtitle}
            </p>
          )}
        </div>
        <div className={cn(glass.panel, "p-8")}>{children}</div>
      </div>
    </div>
  );
}
