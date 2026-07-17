"use client";

import Link from "next/link";
import { useState } from "react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { typographyScale } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      await apiClient.auth.requestPasswordReset(email);
      setMessage("If the email exists, a password reset link has been sent.");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-border bg-card p-8 shadow-sm">
        <div>
          <h1 className={typographyScale.title.className}>Forgot password</h1>
          <p className={cn(typographyScale.body.className, "mt-2 text-muted-foreground")}>
            Enter your email and we&apos;ll send reset instructions.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>}
          {message && <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">{message}</div>}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Sending..." : "Send reset link"}
          </Button>
        </form>

        <Link href="/login" className="text-sm text-brand-600 hover:text-brand-700">
          Back to login
        </Link>
      </div>
    </div>
  );
}
