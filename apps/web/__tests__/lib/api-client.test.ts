import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiClient, ApiClientError } from "@/lib/api-client";

describe("apiClient", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function mockFetchResponse(
    status: number,
    body: unknown,
    options?: { jsonThrows?: boolean },
  ) {
    vi.mocked(fetch).mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: options?.jsonThrows
        ? vi.fn().mockRejectedValue(new Error("Invalid JSON"))
        : vi.fn().mockResolvedValue(body),
    } as unknown as Response);
  }

  describe("request (via health.get)", () => {
    it("returns parsed success response", async () => {
      mockFetchResponse(200, {
        data: { status: "ok", service: "workforce360-api" },
        error: null,
        meta: null,
      });

      const result = await apiClient.health.get();

      expect(result.data?.status).toBe("ok");
      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:4000/api/health",
        expect.objectContaining({
          credentials: "include",
          cache: "no-store",
        }),
      );
    });

    it("throws ApiClientError on HTTP error", async () => {
      mockFetchResponse(500, {
        data: null,
        error: { code: "INTERNAL_ERROR", message: "Server error" },
        meta: null,
      });

      await expect(apiClient.health.get()).rejects.toThrow(ApiClientError);
      await expect(apiClient.health.get()).rejects.toMatchObject({
        status: 500,
        code: "INTERNAL_ERROR",
        message: "Server error",
      });
    });

    it("throws ApiClientError on invalid JSON", async () => {
      mockFetchResponse(200, null, { jsonThrows: true });

      await expect(apiClient.health.get()).rejects.toMatchObject({
        code: "INVALID_RESPONSE",
      });
    });
  });

  describe("auth.login", () => {
    it("sends POST with credentials", async () => {
      mockFetchResponse(200, {
        data: { user: {}, accessToken: "a", refreshToken: "r" },
        error: null,
        meta: null,
      });

      await apiClient.auth.login("user@example.com", "pass");

      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:4000/api/auth/login",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ email: "user@example.com", password: "pass" }),
        }),
      );
    });
  });

  describe("auth.getMe (requestSession)", () => {
    it("returns null on 401 without throwing", async () => {
      mockFetchResponse(401, { data: null, error: null, meta: null });

      const result = await apiClient.auth.getMe();

      expect(result).toBeNull();
    });

    it("throws on non-401 errors", async () => {
      mockFetchResponse(500, {
        data: null,
        error: { code: "INTERNAL_ERROR", message: "Error" },
        meta: null,
      });

      await expect(apiClient.auth.getMe()).rejects.toThrow(ApiClientError);
    });
  });

  describe("users.list query building", () => {
    it("appends query parameters", async () => {
      mockFetchResponse(200, { data: [], error: null, meta: null });

      await apiClient.users.list({ search: "john", status: "active" });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("search=john"),
        expect.any(Object),
      );
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("status=active"),
        expect.any(Object),
      );
    });

    it("omits empty query parameters", async () => {
      mockFetchResponse(200, { data: [], error: null, meta: null });

      await apiClient.users.list({ search: undefined });

      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:4000/api/users",
        expect.any(Object),
      );
    });
  });

  describe("ApiClientError", () => {
    it("exposes status, code, and details", () => {
      const error = new ApiClientError("Forbidden", 403, "FORBIDDEN", {
        required: ["user.read"],
      });

      expect(error.name).toBe("ApiClientError");
      expect(error.message).toBe("Forbidden");
      expect(error.status).toBe(403);
      expect(error.code).toBe("FORBIDDEN");
      expect(error.details).toEqual({ required: ["user.read"] });
    });
  });
});
