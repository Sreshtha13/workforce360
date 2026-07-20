"use client";

import Link from "next/link";
import { useState } from "react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { AuthLayout } from "@/components/design-system/auth-layout";
import { AlertBanner } from "@/components/admin/admin-states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <AuthLayout
      title="Forgot password"
      subtitle="Enter your email and we'll send reset instructions."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <AlertBanner variant="error" message={error} />}
        {message && <AlertBanner variant="success" message={message} />}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Sending..." : "Send reset link"}
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
