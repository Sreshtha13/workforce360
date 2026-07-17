"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { typographyScale } from "@/lib/design-tokens";

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
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-50 via-background to-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <span className="inline-flex h-16 w-16 items-center justify-center rounded-lg bg-brand-600 text-2xl font-bold text-white">
              W
            </span>
          </div>
          <h1 className={cn(typographyScale.title.className, "mb-2")}>
            Welcome to Workforce 360
          </h1>
          <p className={typographyScale.body.className}>
            Sign in to your account to continue
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>
            )}

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

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Signing in..." : "Sign in"}
            </Button>

            <div className="text-center">
              <Link href="/forgot-password" className="text-sm text-brand-600 hover:text-brand-700">
                Forgot your password?
              </Link>
            </div>
          </form>

          <div className="mt-6 rounded-md bg-blue-50 p-3 text-sm text-blue-800">
            <p className="font-medium">Demo credentials</p>
            <p className="mt-1">Email: admin@workforce360.com</p>
            <p>Password: Admin@123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
