/**
 * Canonical API response envelope for Workforce 360.
 * Every route returns this shape: { data, error, meta }.
 */
export type ApiErrorBody = {
  code: string;
  message: string;
  details?: unknown;
};

export type ApiMeta = {
  page?: number;
  pageSize?: number;
  total?: number;
  sort?: string;
  filters?: Record<string, unknown>;
  [key: string]: unknown;
};

export type ApiResponse<T> = {
  data: T | null;
  error: ApiErrorBody | null;
  meta: ApiMeta | null;
};

export type HealthCheckData = {
  status: "ok" | "degraded";
  service: string;
  timestamp: string;
  database: {
    connected: boolean;
    latencyMs: number | null;
    probeLabel: string | null;
  };
};
