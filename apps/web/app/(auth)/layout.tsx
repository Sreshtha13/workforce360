"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { LoadingSkeleton } from "@/components/design-system/loading-skeleton";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="auth-canvas flex min-h-screen items-center justify-center p-4">
        <LoadingSkeleton variant="card" className="w-full max-w-md" />
      </div>
    );
  }

  if (user) return null;

  return children;
}
