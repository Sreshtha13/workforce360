import Link from "next/link";
import type { ReactNode } from "react";

export default function CareersLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-canvas min-h-screen">
      <header className="border-b border-white/10 bg-white/40 px-6 py-4 backdrop-blur dark:bg-white/5">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/careers" className="text-lg font-semibold tracking-tight">
            Workforce 360 Careers
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/login" className="text-muted-foreground hover:text-foreground">
              Sign in
            </Link>
            <Link
              href="/careers/register"
              className="rounded-lg bg-brand-600 px-3 py-1.5 font-medium text-white"
            >
              Create account
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
