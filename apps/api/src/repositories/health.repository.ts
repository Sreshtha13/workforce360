import { prisma } from "../lib/prisma";

export class HealthRepository {
  async ping(): Promise<{
    latencyMs: number;
    probeLabel: string | null;
  }> {
    const started = Date.now();

    try {
      const probe = await prisma.healthProbe.findFirst({
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
        select: { label: true },
      });

      return {
        latencyMs: Date.now() - started,
        probeLabel: probe?.label ?? null,
      };
    } catch {
      // Table missing or connection flaky — still prove DB reachability.
      await prisma.$queryRaw`SELECT 1`;
      return {
        latencyMs: Date.now() - started,
        probeLabel: null,
      };
    }
  }
}

export const healthRepository = new HealthRepository();
