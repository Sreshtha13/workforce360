"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  AlertBanner,
  ErrorState,
  LoadingState,
} from "@/components/admin/admin-states";
import { FormField } from "@/components/admin/form-fields";
import { GlassCard } from "@/components/dashboard/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function PortalSecurityPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [setupCode, setSetupCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const statusQuery = useQuery({
    queryKey: ["mfa", "status"],
    queryFn: async () => (await apiClient.auth.mfa.status()).data!,
    enabled: !!user,
  });

  const devicesQuery = useQuery({
    queryKey: ["auth", "devices"],
    queryFn: async () => (await apiClient.auth.devices.list()).data!,
    enabled: !!user,
  });

  const setupMutation = useMutation({
    mutationFn: () => apiClient.auth.mfa.setup(),
    onSuccess: (res) => {
      setQrDataUrl(res.data?.qrDataUrl ?? null);
      setBackupCodes(null);
      setFeedback("Scan the QR code, then enter a code to enable MFA.");
      setError(null);
    },
    onError: (err) =>
      setError(err instanceof ApiClientError ? err.message : "MFA setup failed"),
  });

  const enableMutation = useMutation({
    mutationFn: () => apiClient.auth.mfa.enable(setupCode.trim()),
    onSuccess: (res) => {
      setBackupCodes(res.data?.backupCodes ?? null);
      setQrDataUrl(null);
      setSetupCode("");
      setFeedback("MFA enabled. Store your backup codes securely.");
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["mfa", "status"] });
    },
    onError: (err) =>
      setError(err instanceof ApiClientError ? err.message : "Failed to enable MFA"),
  });

  const disableMutation = useMutation({
    mutationFn: () => apiClient.auth.mfa.disable(disableCode.trim()),
    onSuccess: () => {
      setDisableCode("");
      setBackupCodes(null);
      setFeedback("MFA disabled.");
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["mfa", "status"] });
    },
    onError: (err) =>
      setError(err instanceof ApiClientError ? err.message : "Failed to disable MFA"),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => apiClient.auth.devices.revoke(id),
    onSuccess: () => {
      setFeedback("Device revoked.");
      queryClient.invalidateQueries({ queryKey: ["auth", "devices"] });
    },
    onError: (err) =>
      setError(err instanceof ApiClientError ? err.message : "Failed to revoke device"),
  });

  if (!user) return null;
  if (statusQuery.isLoading) return <LoadingState message="Loading security settings..." />;
  if (statusQuery.isError) {
    return (
      <ErrorState message="Failed to load MFA status." onRetry={() => statusQuery.refetch()} />
    );
  }

  const status = statusQuery.data!;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Security"
        description="Manage two-factor authentication and trusted devices for your account."
      />

      {feedback && (
        <AlertBanner variant="success" message={feedback} onDismiss={() => setFeedback(null)} />
      )}
      {error && (
        <AlertBanner variant="error" message={error} onDismiss={() => setError(null)} />
      )}

      <GlassCard className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Two-factor authentication</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Protect your account with an authenticator app.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={status.enabled ? "success" : "warning"}>
              {status.enabled ? "Enabled" : "Disabled"}
            </Badge>
            {status.enforcedByRole && <Badge variant="secondary">Required by role</Badge>}
          </div>
        </div>

        <p className="mt-3 text-sm text-muted-foreground">
          Backup codes remaining: {status.backupCodesRemaining}
        </p>

        {!status.enabled ? (
          <div className="mt-6 space-y-4">
            <Button
              onClick={() => setupMutation.mutate()}
              disabled={setupMutation.isPending}
            >
              {setupMutation.isPending ? "Preparing..." : "Set up MFA"}
            </Button>
            {qrDataUrl && (
              <div className="space-y-4 rounded-xl bg-white/40 p-4 dark:bg-white/5">
                {/* eslint-disable-next-line @next/next/no-img-element -- data URL from MFA setup */}
                <img
                  src={qrDataUrl}
                  alt="MFA QR code"
                  width={180}
                  height={180}
                  className="rounded-lg bg-white p-2"
                />
                <FormField
                  label="Verification code"
                  name="setupCode"
                  value={setupCode}
                  onChange={setSetupCode}
                  placeholder="123456"
                />
                <Button
                  onClick={() => enableMutation.mutate()}
                  disabled={enableMutation.isPending || setupCode.trim().length < 6}
                >
                  {enableMutation.isPending ? "Enabling..." : "Enable MFA"}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-6 max-w-sm space-y-3">
            <FormField
              label="Code to disable MFA"
              name="disableCode"
              value={disableCode}
              onChange={setDisableCode}
              placeholder="Authenticator or backup code"
            />
            <Button
              variant="destructive"
              onClick={() => disableMutation.mutate()}
              disabled={disableMutation.isPending || !disableCode.trim()}
            >
              {disableMutation.isPending ? "Disabling..." : "Disable MFA"}
            </Button>
          </div>
        )}

        {backupCodes && backupCodes.length > 0 && (
          <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
            <p className="text-sm font-medium">Backup codes (save these now)</p>
            <ul className="mt-2 grid gap-1 font-mono text-sm sm:grid-cols-2">
              {backupCodes.map((code) => (
                <li key={code}>{code}</li>
              ))}
            </ul>
          </div>
        )}
      </GlassCard>

      <GlassCard>
        <div className="border-b border-white/10 p-6 pb-4 dark:border-white/5">
          <h2 className="text-lg font-semibold tracking-tight">Trusted devices</h2>
          <p className="text-sm text-muted-foreground">
            Revoke a device to end its remembered MFA trust / linked session.
          </p>
        </div>
        <div className="p-6">
          {devicesQuery.isLoading ? (
            <LoadingState message="Loading devices..." />
          ) : devicesQuery.isError ? (
            <ErrorState
              message="Failed to load devices."
              onRetry={() => devicesQuery.refetch()}
            />
          ) : (devicesQuery.data?.devices.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">No trusted devices yet.</p>
          ) : (
            <ul className="space-y-3">
              {devicesQuery.data!.devices.map((device) => (
                <li
                  key={device.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white/30 px-3 py-3 text-sm dark:bg-white/5"
                >
                  <div>
                    <p className="font-medium">{device.label || "Unknown device"}</p>
                    <p className="text-xs text-muted-foreground">
                      Last seen {new Date(device.lastSeenAt).toLocaleString()}
                      {device.ipAddress ? ` · ${device.ipAddress}` : ""}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      confirm("Revoke this device?") && revokeMutation.mutate(device.id)
                    }
                  >
                    Revoke
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
