import { healthRepository } from "../repositories/health.repository";
import type { HealthCheckData } from "../types/api";

export class HealthService {
  async getHealth(): Promise<HealthCheckData> {
    const timestamp = new Date().toISOString();

    try {
      const { latencyMs, probeLabel } = await healthRepository.ping();

      return {
        status: "ok",
        service: "workforce360-api",
        timestamp,
        database: {
          connected: true,
          latencyMs,
          probeLabel,
        },
      };
    } catch {
      return {
        status: "degraded",
        service: "workforce360-api",
        timestamp,
        database: {
          connected: false,
          latencyMs: null,
          probeLabel: null,
        },
      };
    }
  }
}

export const healthService = new HealthService();
