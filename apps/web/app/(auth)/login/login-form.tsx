"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { statusSurface } from "@/lib/design-system";
import { typographyScale } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { AuthLayout } from "@/components/design-system/auth-layout";
import { AlertBanner } from "@/components/admin/admin-states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginForm() {
  const { login, verifyMfa, refetch } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("admin@workforce360.com");
  const [password, setPassword] = useState("");
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [mfaSetupRequired, setMfaSetupRequired] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);

  useEffect(() => {
    const urlMfaToken = searchParams.get("mfaToken");
    const urlMfaSetup = searchParams.get("mfaSetupRequired");
    const urlError = searchParams.get("error");

    if (urlError) {
      setError(
        urlError === "google_login_failed"
          ? "Google sign-in failed. Try email/password or contact your administrator."
          : "Sign-in failed. Please try again.",
      );
    }

    if (urlMfaToken) {
      setMfaToken(urlMfaToken);
      setMfaSetupRequired(urlMfaSetup === "true");
    }

    apiClient.auth.getGoogleAuthUrl().then((res) => {
      setGoogleEnabled(Boolean(res.data?.enabled && res.data?.url));
    }).catch(() => setGoogleEnabled(false));
  }, [searchParams]);

  const resetMfaState = () => {
    setMfaToken(null);
    setMfaSetupRequired(false);
    setMfaCode("");
    setQrDataUrl(null);
    setBackupCodes(null);
    setError("");
    router.replace("/login");
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await apiClient.auth.getGoogleAuthUrl();
      if (res.data?.url) {
        window.location.href = res.data.url;
        return;
      }
      setError("Google sign-in is not configured on this server.");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSetupMfa = async () => {
    if (!mfaToken) return;
    setError("");
    setLoading(true);
    try {
      const res = await apiClient.auth.mfa.setupChallenge(mfaToken);
      setQrDataUrl(res.data?.qrDataUrl ?? null);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "MFA setup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mfaToken && mfaSetupRequired && qrDataUrl) {
        const res = await apiClient.auth.mfa.enableChallenge(mfaToken, mfaCode.trim());
        setBackupCodes(res.data?.backupCodes ?? null);
        setQrDataUrl(null);
        setMfaCode("");
        await refetch();
        return;
      }
      if (mfaToken && !mfaSetupRequired) {
        await verifyMfa(mfaToken, mfaCode.trim());
        return;
      }
      const outcome = await login(email, password);
      if (outcome.mfaRequired) {
        setMfaToken(outcome.mfaToken);
        setMfaSetupRequired(Boolean(outcome.mfaSetupRequired));
        setMfaCode("");
        setQrDataUrl(null);
        setBackupCodes(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const title = backupCodes
    ? "Save your backup codes"
    : mfaToken && mfaSetupRequired
      ? qrDataUrl
        ? "Enable two-factor authentication"
        : "Set up two-factor authentication"
      : mfaToken
        ? "Two-factor authentication"
        : "Welcome to Workforce 360";

  const subtitle = backupCodes
    ? "Store these codes securely. Each can be used once if you lose your authenticator."
    : mfaToken && mfaSetupRequired
      ? qrDataUrl
        ? "Scan the QR code, then enter the 6-digit code from your app"
        : "Your role requires MFA before you can sign in"
      : mfaToken
        ? "Enter the 6-digit code from your authenticator app"
        : "Sign in to your account to continue";

  return (
    <AuthLayout title={title} subtitle={subtitle}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <AlertBanner variant="error" message={error} />}

        {backupCodes ? (
          <div className="space-y-3 rounded-xl border bg-muted/40 p-4 font-mono text-sm">
            {backupCodes.map((code) => (
              <div key={code}>{code}</div>
            ))}
            <Button
              type="button"
              className="mt-2 w-full"
              onClick={async () => {
                await refetch();
                router.push("/dashboard");
              }}
            >
              Continue to dashboard
            </Button>
          </div>
        ) : !mfaToken ? (
          <>
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
          </>
        ) : mfaSetupRequired && !qrDataUrl ? (
          <Button type="button" className="w-full" disabled={loading} onClick={handleSetupMfa}>
            {loading ? "Preparing setup..." : "Begin MFA setup"}
          </Button>
        ) : (
          <>
            {qrDataUrl && (
              <div className="flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrDataUrl} alt="MFA QR code" className="h-48 w-48 rounded-lg border" />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="mfaCode">Authentication code</Label>
              <Input
                id="mfaCode"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                required
                placeholder="123456"
                maxLength={12}
              />
              {!mfaSetupRequired && (
                <p className={typographyScale.helper.className}>
                  You can also use a backup code if you lost access to your app.
                </p>
              )}
            </div>
          </>
        )}

        {!backupCodes && !(mfaToken && mfaSetupRequired && !qrDataUrl) && (
          <Button type="submit" disabled={loading} className="w-full shadow-md shadow-primary/15">
            {loading
              ? mfaToken
                ? "Verifying..."
                : "Signing in..."
              : mfaToken
                ? mfaSetupRequired
                  ? "Enable and continue"
                  : "Verify and continue"
                : "Sign in"}
          </Button>
        )}

        {mfaToken && !backupCodes ? (
          <Button type="button" variant="ghost" className="w-full" onClick={resetMfaState}>
            Back to sign in
          </Button>
        ) : !mfaToken ? (
          <div className="text-center">
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-brand-700 transition-colors hover:text-brand-600 dark:text-brand-300"
            >
              Forgot your password?
            </Link>
          </div>
        ) : null}
      </form>

      {!mfaToken && googleEnabled && (
        <div className="mt-4">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={loading}
            onClick={handleGoogleSignIn}
          >
            Sign in with Google
          </Button>
        </div>
      )}

      {!mfaToken && (
        <div className={cn("mt-6 rounded-xl p-4 text-sm", statusSurface.info)}>
          <p className={typographyScale.label.className}>Demo credentials</p>
          <p className="mt-2 text-muted-foreground">Admin: admin@workforce360.com / Admin@123</p>
          <p className="text-muted-foreground">HR: hr@workforce360.com / Hr@123456</p>
          <p className="mt-3">
            <Link href="/careers" className="font-medium text-brand-700 hover:underline dark:text-brand-300">
              Browse careers and apply →
            </Link>
          </p>
        </div>
      )}
    </AuthLayout>
  );
}
