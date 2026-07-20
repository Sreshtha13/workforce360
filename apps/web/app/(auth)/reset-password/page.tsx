"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { AuthLayout } from "@/components/design-system/auth-layout";
import { LoadingSkeleton } from "@/components/design-system/loading-skeleton";
import { AlertBanner } from "@/components/admin/admin-states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!token) {
      setError("Missing reset token in URL.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await apiClient.auth.resetPassword(token, password);
      setMessage("Password reset successfully. You can now sign in.");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Reset password" subtitle="Choose a new password for your account.">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <AlertBanner variant="error" message={error} />}
        {message && <AlertBanner variant="success" message={message} />}

        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm password</Label>
          <Input
            id="confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={8}
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Resetting..." : "Reset password"}
        </Button>
      </form>

      <Link
        href="/login"
        className="mt-6 inline-block text-sm font-medium text-brand-700 hover:text-brand-600 dark:text-brand-300"
      >
        Back to login
      </Link>
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-canvas flex min-h-screen items-center justify-center p-4">
          <LoadingSkeleton variant="card" className="w-full max-w-md" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
