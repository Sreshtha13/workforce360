import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "./app";

const mockPing = vi.fn();

vi.mock("./repositories/health.repository", () => ({
  healthRepository: {
    ping: (...args: unknown[]) => mockPing(...args),
  },
  HealthRepository: class {
    ping = (...args: unknown[]) => mockPing(...args);
  },
}));

describe("API integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /", () => {
    it("returns API metadata", async () => {
      const app = createApp();
      const response = await request(app).get("/");

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe("Workforce 360 ERP API");
      expect(response.body.error).toBeNull();
    });
  });

  describe("GET /api/health", () => {
    it("returns ok when database is reachable", async () => {
      mockPing.mockResolvedValue({ latencyMs: 5, probeLabel: "SELECT 1" });
      const app = createApp();

      const response = await request(app).get("/api/health");

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe("ok");
      expect(response.body.data.database.connected).toBe(true);
    });

    it("returns degraded when database ping fails", async () => {
      mockPing.mockRejectedValue(new Error("DB down"));
      const app = createApp();

      const response = await request(app).get("/api/health");

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe("degraded");
      expect(response.body.data.database.connected).toBe(false);
    });
  });

  describe("unknown routes", () => {
    it("returns 404 NOT_FOUND", async () => {
      const app = createApp();
      const response = await request(app).get("/api/does-not-exist");

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe("NOT_FOUND");
    });
  });
});
