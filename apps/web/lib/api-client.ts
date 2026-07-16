import type { ApiResponse, HealthCheckData } from "@/types/api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${path}`;

  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...init?.headers,
    },
    credentials: "include",
    cache: "no-store",
  });

  let body: ApiResponse<T>;
  try {
    body = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new ApiClientError(
      "Invalid JSON response from API",
      response.status,
      "INVALID_RESPONSE",
    );
  }

  if (!response.ok || body.error) {
    throw new ApiClientError(
      body.error?.message ?? `Request failed with status ${response.status}`,
      response.status,
      body.error?.code,
      body.error?.details,
    );
  }

  return body;
}

/**
 * Typed HTTP client for the Workforce 360 API.
 * The web app must never import Prisma, Postgres drivers, or Supabase Admin SDK.
 */
export const apiClient = {
  health: {
    get: () => request<HealthCheckData>("/api/health"),
  },
};
