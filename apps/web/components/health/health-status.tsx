"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { typographyScale } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function HealthStatus() {
  const query = useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      const response = await apiClient.health.get();
      if (!response.data) {
        throw new ApiClientError("Empty health payload", 500, "EMPTY_DATA");
      }
      return response.data;
    },
  });

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <p className={typographyScale.label.className}>Phase 0 smoke test</p>
        <h2 className={typographyScale.display.className}>API health check</h2>
        <p className={cn(typographyScale.body.className, "text-muted-foreground")}>
          This page calls <code className="text-foreground">GET /api/health</code>{" "}
          through the typed API client. The frontend never talks to Postgres —
          only the Express API does.
        </p>
      </div>

      <div className="space-y-4 rounded-lg border border-border bg-card/60 p-5">
        {query.isLoading && (
          <p className={typographyScale.body.className}>Checking API…</p>
        )}

        {query.isError && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-destructive">
              Could not reach the API
            </p>
            <p className={typographyScale.caption.className}>
              {query.error instanceof Error
                ? query.error.message
                : "Unknown error"}
            </p>
            <p className={typographyScale.caption.className}>
              Ensure the API is running on{" "}
              {process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000"}{" "}
              and <code>DATABASE_URL</code> is set in <code>apps/api</code>.
            </p>
          </div>
        )}

        {query.data && (
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className={typographyScale.label.className}>Status</dt>
              <dd
                className={cn(
                  "mt-1 font-medium",
                  query.data.status === "ok"
                    ? "text-[oklch(0.45_0.12_150)]"
                    : "text-[oklch(0.65_0.14_75)]",
                )}
              >
                {query.data.status}
              </dd>
            </div>
            <div>
              <dt className={typographyScale.label.className}>Service</dt>
              <dd className="mt-1 font-medium">{query.data.service}</dd>
            </div>
            <div>
              <dt className={typographyScale.label.className}>Database</dt>
              <dd className="mt-1 font-medium">
                {query.data.database.connected ? "connected" : "unreachable"}
              </dd>
            </div>
            <div>
              <dt className={typographyScale.label.className}>DB latency</dt>
              <dd className="mt-1 font-medium">
                {query.data.database.latencyMs != null
                  ? `${query.data.database.latencyMs} ms`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className={typographyScale.label.className}>Probe label</dt>
              <dd className="mt-1 font-medium">
                {query.data.database.probeLabel ?? "raw SELECT 1"}
              </dd>
            </div>
            <div>
              <dt className={typographyScale.label.className}>Timestamp</dt>
              <dd className="mt-1 font-medium">{query.data.timestamp}</dd>
            </div>
          </dl>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => query.refetch()}
          disabled={query.isFetching}
        >
          {query.isFetching ? "Refreshing…" : "Refresh"}
        </Button>
      </div>
    </section>
  );
}
