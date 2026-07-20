import { describe, it, expect, vi, beforeEach } from "vitest";
import { HealthService } from "./health.service";

const mockPing = vi.fn();

vi.mock("../repositories/health.repository", () => ({
  healthRepository: {
    ping: (...args: unknown[]) => mockPing(...args),
  },
}));

describe("HealthService", () => {
  let service: HealthService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new HealthService();
  });

  it("returns ok status when database ping succeeds", async () => {
    mockPing.mockResolvedValue({ latencyMs: 12, probeLabel: "SELECT 1" });

    const result = await service.getHealth();

    expect(result.status).toBe("ok");
    expect(result.service).toBe("workforce360-api");
    expect(result.database.connected).toBe(true);
    expect(result.database.latencyMs).toBe(12);
    expect(result.timestamp).toBeTruthy();
  });

  it("returns degraded status when database ping fails", async () => {
    mockPing.mockRejectedValue(new Error("Connection refused"));

    const result = await service.getHealth();

    expect(result.status).toBe("degraded");
    expect(result.database.connected).toBe(false);
    expect(result.database.latencyMs).toBeNull();
    expect(result.database.probeLabel).toBeNull();
  });
});
