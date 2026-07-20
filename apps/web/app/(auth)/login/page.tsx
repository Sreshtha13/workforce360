"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { statusSurface } from "@/lib/design-system";
import { typographyScale } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { AuthLayout } from "@/components/design-system/auth-layout";
import { AlertBanner } from "@/components/admin/admin-states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("admin@workforce360.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome to Workforce 360" subtitle="Sign in to your account to continue">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <AlertBanner variant="error" message={error} />}

        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="admin@workforce360.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full shadow-md shadow-primary/15">
          {loading ? "Signing in..." : "Sign in"}
        </Button>

        <div className="text-center">
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-brand-700 transition-colors hover:text-brand-600 dark:text-brand-300"
          >
            Forgot your password?
          </Link>
        </div>
      </form>

      <div className={cn("mt-6 rounded-xl p-4 text-sm", statusSurface.info)}>
        <p className={typographyScale.label.className}>Demo credentials</p>
        <p className="mt-2 text-muted-foreground">Email: admin@workforce360.com</p>
        <p className="text-muted-foreground">Password: Admin@123</p>
      </div>
    </AuthLayout>
  );
}
